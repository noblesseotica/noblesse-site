#!/usr/bin/env python3
"""Aplica no site o conteúdo editado pelo painel (oticanoblesse.com.br/admin).

O painel Decap grava um arquivo por área em conteudo/*.json (seo, topo,
evento, secoes, horario, vitrine, depoimentos, google). Este script lê esses
arquivos, valida cada valor e gera o que o site publica:

  * textos do index.html marcados com data-c="<chave>" (e data-c-whatsapp
    para o link do botão da faixa de evento);
  * as fotos da vitrine, entre <!-- vitrine:inicio --> e <!-- vitrine:fim -->;
  * Google Analytics e verificação do Search Console, entre
    <!-- google:inicio --> e <!-- google:fim --> no <head>;
  * assets/js/conteudo.js, com faixa de evento, horário, depoimentos e selo do
    Google, lido pelo main.js.

Também reduz as fotos enviadas pelo painel (assets/img/uploads) para no máximo
1600 px de largura, para uma foto de celular não deixar o site lento.

Valor vazio ou inválido mantém o que já está no site (com um aviso); só as
listas (horário, vitrine, depoimentos) usam a remoção do item para removê-lo.

Uso:
  python3 scripts/conteudo.py            # aplica conteudo/*.json
  python3 scripts/conteudo.py --iniciar  # cria conteudo/*.json a partir do site atual
"""

import argparse
import html
import json
import re
import sys
import urllib.parse
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
INDEX = RAIZ / "index.html"
PASTA_CONTEUDO = RAIZ / "conteudo"
# arquivo -> campo da lista (as áreas que são listas guardam os itens nele)
AREAS = {"seo": None, "topo": None, "evento": None, "secoes": None, "google": None,
         "horario": "itens", "vitrine": "fotos", "depoimentos": "itens"}
CONTEUDO_JS = RAIZ / "assets" / "js" / "conteudo.js"
MAIN_JS = RAIZ / "assets" / "js" / "main.js"
UPLOADS = RAIZ / "assets" / "img" / "uploads"

LIMITE_TEXTO = 600
LARGURA_MAX_FOTO = 1600
FORMATOS_FOTO = (".jpg", ".jpeg", ".png", ".webp")
SEGUNDOS_POR_FOTO = 56 / 6  # ritmo original da esteira: 6 fotos em 56 s

# chave data-c no index.html  ->  (arquivo em conteudo/, campo)
TEXTOS = {
    "seo.titulo": ("seo", "titulo"),
    "seo.descricao": ("seo", "descricao"),
    "previa.titulo": ("seo", "previa_titulo"),
    "previa.descricao": ("seo", "previa_descricao"),
    "topo.chamada": ("topo", "chamada"),
    "topo.titulo": ("topo", "titulo"),
    "topo.texto": ("topo", "texto"),
    "evento.titulo": ("evento", "titulo"),
    "evento.texto": ("evento", "texto"),
    "evento.botao": ("evento", "botao"),
    "secao.diferenciais": ("secoes", "diferenciais"),
    "secao.ivision": ("secoes", "ivision"),
    "secao.marcas": ("secoes", "marcas"),
    "secao.vitrine": ("secoes", "vitrine"),
    "secao.inauguracao": ("secoes", "inauguracao"),
    "secao.depoimentos": ("secoes", "depoimentos"),
    "secao.missao": ("secoes", "missao"),
    "secao.valores": ("secoes", "valores"),
    "secao.localizacao": ("secoes", "localizacao"),
    "secao.agendamento": ("secoes", "agendamento"),
}


class ErroConteudo(Exception):
    pass


def _txt(v):
    return str(v).strip()[:LIMITE_TEXTO] if v is not None else ""


def _pega(dados, *caminho):
    for parte in caminho:
        if not isinstance(dados, dict):
            return ""
        dados = dados.get(parte)
    return _txt(dados)


def _num(v):
    if v in (None, ""):
        return None
    try:
        return float(str(v).replace(",", ".").strip())
    except ValueError:
        return None


# ------------------------------------------------------------- HTML: textos

def _texto_do_html(trecho):
    """Texto puro de um trecho do HTML, com <em> virando *asteriscos*."""
    t = re.sub(r"</?em>", "*", trecho)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    return re.sub(r"\s+", " ", t).strip()


def _texto_para_html(valor, italico):
    t = html.escape(valor, quote=False)
    if italico:
        t = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", t)
    return t


def aplicar_textos(src, dados, avisos):
    for chave, caminho in TEXTOS.items():
        valor = _pega(dados, *caminho)
        if not valor:
            continue  # vazio = mantém o texto atual
        pad_meta = re.compile(r'(<meta\b[^>]*\bdata-c="%s"[^>]*\bcontent=")([^"]*)(")' % re.escape(chave))
        m = pad_meta.search(src)
        if m:
            if html.unescape(m.group(2)) != valor:
                src = pad_meta.sub(lambda m: m.group(1) + html.escape(valor, quote=True) + m.group(3), src)
            continue
        pad = re.compile(r'(<(\w+)\b[^>]*\bdata-c="%s"[^>]*>)(.*?)(</\2>)' % re.escape(chave), re.S)
        m = pad.search(src)
        if not m:
            avisos.append(f"Marcação {chave} não encontrada no index.html.")
            continue
        if _texto_do_html(m.group(3)) == valor:
            continue  # já está igual: não reformata o HTML à toa
        novo = _texto_para_html(valor, italico=(chave == "topo.titulo"))
        src = pad.sub(lambda m: m.group(1) + novo + m.group(4), src, count=1)

    msg = _pega(dados, "evento", "mensagem")
    if msg:
        pad = re.compile(r'(<a\b[^>]*\bdata-c-whatsapp="evento.mensagem"[^>]*\bhref=")([^"]*)(")', re.S)
        m = pad.search(src)
        atual = urllib.parse.unquote(html.unescape(m.group(2)).partition("?text=")[2]) if m else None
        if m and atual != msg:
            url = f"https://wa.me/{numero_whatsapp()}?text=" + urllib.parse.quote(msg, safe="")
            src = pad.sub(lambda m: m.group(1) + html.escape(url, quote=True) + m.group(3), src)
    return src


# ------------------------------------------------------------ HTML: vitrine

def _caminho_foto(foto):
    """'/assets/img/x.webp' -> 'assets/img/x.webp' (o site usa caminhos relativos)."""
    return foto.strip().lstrip("/")


def aplicar_vitrine(src, dados, avisos):
    ini, fim = "<!-- vitrine:inicio -->", "<!-- vitrine:fim -->"
    if ini not in src or fim not in src:
        avisos.append("Marcadores da vitrine não encontrados no index.html.")
        return src
    fotos = []
    for i, item in enumerate(dados.get("vitrine") or [], 1):
        foto = _txt((item or {}).get("foto"))
        if not foto:
            continue
        caminho = _caminho_foto(foto)
        if not caminho.lower().endswith(FORMATOS_FOTO):
            avisos.append(f"Vitrine, foto {i}: formato não suportado ({caminho}). Envie JPG, PNG ou WEBP.")
            continue
        if not (RAIZ / caminho).is_file():
            avisos.append(f"Vitrine, foto {i}: arquivo {caminho} não encontrado.")
            continue
        fotos.append((caminho, _txt(item.get("descricao"))))
    if not fotos:
        avisos.append("Vitrine sem nenhuma foto válida: mantida como estava.")
        return src

    def figura(caminho, alt, copia):
        extra = ' aria-hidden="true"' if copia else ""
        alt = "" if copia else html.escape(alt, quote=True)
        return (f'      <figure class="vitrine-item"{extra}>\n'
                f'        <img src="{html.escape(caminho, quote=True)}" width="480" height="360" '
                f'loading="lazy" decoding="async" alt="{alt}">\n'
                f"      </figure>\n")

    duracao = round(len(fotos) * SEGUNDOS_POR_FOTO)
    bloco = (f"{ini}\n"
             f'    <div class="vitrine-trilho" id="vitrine-trilho" style="--vdur:{duracao}s">\n'
             "      <!-- GERADO pelo painel (conteudo/vitrine.json → scripts/conteudo.py). -->\n"
             "      <!-- bloco 1 (lido por leitores de tela) -->\n"
             + "".join(figura(c, a, False) for c, a in fotos)
             + "\n      <!-- bloco 2: cópia visual para o loop não ter emenda -->\n"
             + "".join(figura(c, a, True) for c, a in fotos)
             + f"    </div>\n    {fim}")
    a, b = src.index(ini), src.index(fim) + len(fim)
    return src[:a] + bloco + src[b:]


# ------------------------------------------------ HTML: ferramentas do Google

def aplicar_google(src, dados, avisos):
    ini, fim = "<!-- google:inicio -->", "<!-- google:fim -->"
    if ini not in src or fim not in src:
        avisos.append("Marcadores do Google não encontrados no index.html.")
        return src
    linhas = []

    verif = _pega(dados, "seo", "search_console")
    if verif:
        m = re.search(r'content="([^"]+)"', verif)  # aceita a tag inteira colada
        token = (m.group(1) if m else verif).strip()
        if re.fullmatch(r"[\w-]{10,100}", token):
            linhas.append(f'<meta name="google-site-verification" content="{token}">')
        else:
            avisos.append("Código do Search Console em formato inesperado: ignorado.")

    ga = _pega(dados, "seo", "google_analytics").upper()
    if ga:
        if re.fullmatch(r"G-[A-Z0-9]{4,20}", ga):
            linhas += [
                f'<script async src="https://www.googletagmanager.com/gtag/js?id={ga}"></script>',
                "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}"
                f"gtag('js',new Date());gtag('config','{ga}');</script>",
            ]
        else:
            avisos.append('Código do Google Analytics deve começar com "G-": ignorado.')

    corpo = "\n".join(linhas)
    bloco = f"{ini}\n{corpo}\n{fim}" if corpo else f"{ini}\n{fim}"
    a, b = src.index(ini), src.index(fim) + len(fim)
    return src[:a] + bloco + src[b:]


# ------------------------------------------------------------- conteudo.js

def _data(v):
    s = _txt(v)
    for fmt in (r"(\d{4})-(\d{2})-(\d{2})", r"(\d{1,2})/(\d{1,2})/(\d{4})"):
        m = re.match(fmt, s)
        if m:
            g = m.groups()
            a, mes, d = (g[0], g[1], g[2]) if len(g[0]) == 4 else (g[2], g[1], g[0])
            try:
                return date(int(a), int(mes), int(d))
            except ValueError:
                return None
    return None


def montar_conteudo(dados, atual, avisos):
    ev_atual = atual.get("evento") or {"ativo": False, "dataFim": ""}
    ev = {"ativo": bool((dados.get("evento") or {}).get("mostrar")), "dataFim": ev_atual.get("dataFim", "")}
    ate = (dados.get("evento") or {}).get("ate")
    if ate:
        d = _data(ate)
        if d:
            ev["dataFim"] = f"{d.isoformat()}T23:59:59"
        else:
            avisos.append(f'Faixa de evento: data "{ate}" inválida — mantida a anterior.')
    if ev["ativo"] and not ev["dataFim"]:
        avisos.append("Faixa de evento marcada para aparecer, mas sem data final: ficará oculta.")

    horario = []
    for i, h in enumerate(dados.get("horario") or [], 1):
        dias, horas = _txt((h or {}).get("dias")), _txt((h or {}).get("horas"))
        if dias and horas:
            horario.append({"dias": dias, "horas": horas})
        elif dias or horas:
            avisos.append(f"Horário {i}: preencha dias e horas — ignorado.")

    depoimentos = []
    for i, d in enumerate(dados.get("depoimentos") or [], 1):
        nome, texto = _txt((d or {}).get("nome")), _txt((d or {}).get("texto"))
        if not (nome and texto):
            if nome or texto:
                avisos.append(f"Depoimento {i}: preencha nome e texto — ignorado.")
            continue
        nota = _num(d.get("nota"))
        if nota is None or not 1 <= nota <= 5:
            nota = 5
        depoimentos.append({"nome": nome, "texto": texto, "nota": round(nota), "foto": None})

    google = {"nota": None, "avaliacoes": None, "url": ""}
    g = dados.get("google") or {}
    nota, link = _num(g.get("nota")), _txt(g.get("link"))
    if nota is not None or link:
        if nota is None or not 0 < nota <= 5:
            avisos.append("Selo do Google: nota deve ser de 1 a 5 — selo não exibido.")
        elif not link.startswith("https://"):
            avisos.append("Selo do Google: o link deve começar com https:// — selo não exibido.")
        else:
            av = _num(g.get("avaliacoes"))
            google = {"nota": nota, "avaliacoes": int(av) if av else None, "url": link}

    return {"evento": ev, "horario": horario, "depoimentos": depoimentos, "google": google}


def gerar_conteudo_js(conteudo):
    corpo = json.dumps(conteudo, ensure_ascii=False, indent=2)
    return ("/* GERADO AUTOMATICAMENTE a partir do painel (conteudo/*.json → scripts/conteudo.py).\n"
            "   Não edite à mão: a próxima publicação sobrescreve este arquivo. */\n"
            f"window.NOBLESSE_CONTEUDO = {corpo};\n")


def ler_conteudo_js():
    if not CONTEUDO_JS.exists():
        return {}
    m = re.search(r"window\.NOBLESSE_CONTEUDO\s*=\s*(\{.*\});", CONTEUDO_JS.read_text("utf-8"), re.S)
    return json.loads(m.group(1)) if m else {}


def numero_whatsapp():
    m = re.search(r"whatsapp:\s*'(\d+)'", MAIN_JS.read_text("utf-8"))
    return m.group(1) if m else "5534997202967"


# ------------------------------------------------------------------ fotos

def reduzir_fotos(avisos):
    """Reduz fotos grandes enviadas pelo painel, mantendo nome e formato."""
    if not UPLOADS.is_dir():
        return []
    try:
        from PIL import Image, ImageOps
    except ImportError:
        avisos.append("Pillow não instalado: fotos enviadas não foram reduzidas.")
        return []
    mudou = []
    for f in sorted(UPLOADS.iterdir()):
        if f.suffix.lower() not in FORMATOS_FOTO:
            continue
        try:
            with Image.open(f) as im:
                im = ImageOps.exif_transpose(im)  # foto de celular "deitada"
                grande = im.width > LARGURA_MAX_FOTO
                pesada = f.stat().st_size > 400_000
                if not (grande or pesada):
                    continue
                if grande:
                    im = im.resize((LARGURA_MAX_FOTO, round(im.height * LARGURA_MAX_FOTO / im.width)),
                                   Image.LANCZOS)
                ext = f.suffix.lower()
                if ext in (".jpg", ".jpeg"):
                    im.convert("RGB").save(f, "JPEG", quality=82, optimize=True, progressive=True)
                elif ext == ".webp":
                    im.save(f, "WEBP", quality=80, method=6)
                else:
                    im.save(f, "PNG", optimize=True)
            mudou.append(str(f.relative_to(RAIZ)))
        except Exception as e:
            avisos.append(f"Não consegui processar a foto {f.name}: {e}")
    return mudou


# -------------------------------------------------------------- execução

def ler_areas():
    """Junta conteudo/*.json num dicionário só: {"seo": {...}, "horario": [...], ...}."""
    dados = {}
    for area, lista in AREAS.items():
        f = PASTA_CONTEUDO / f"{area}.json"
        try:
            valor = json.loads(f.read_text("utf-8"))
        except (OSError, ValueError) as e:
            raise ErroConteudo(f"não consegui ler {f.relative_to(RAIZ)}: {e}")
        if not isinstance(valor, dict):
            raise ErroConteudo(f"{f.relative_to(RAIZ)} não é um objeto JSON")
        dados[area] = (valor.get(lista) or []) if lista else valor
    return dados


def aplicar():
    avisos = []
    dados = ler_areas()

    mudou = reduzir_fotos(avisos)
    original = INDEX.read_text("utf-8")
    novo = aplicar_textos(original, dados, avisos)
    novo = aplicar_vitrine(novo, dados, avisos)
    novo = aplicar_google(novo, dados, avisos)
    if novo != original:
        INDEX.write_text(novo, "utf-8")
        mudou.append("index.html")
    js = gerar_conteudo_js(montar_conteudo(dados, ler_conteudo_js(), avisos))
    if not CONTEUDO_JS.exists() or js != CONTEUDO_JS.read_text("utf-8"):
        CONTEUDO_JS.write_text(js, "utf-8")
        mudou.append("assets/js/conteudo.js")
    return mudou, avisos


def iniciar():
    """Monta conteudo/*.json com o que está publicado hoje."""
    src = INDEX.read_text("utf-8")
    v = {}
    for m in re.finditer(r'<meta\b[^>]*\bdata-c="([\w.]+)"[^>]*\bcontent="([^"]*)"', src):
        v[m.group(1)] = html.unescape(m.group(2))
    for m in re.finditer(r'<(\w+)\b[^>]*\bdata-c="([\w.]+)"[^>]*>(.*?)</\1>', src, re.S):
        v[m.group(2)] = _texto_do_html(m.group(3))
    dados = {"seo": {}, "topo": {}, "evento": {}, "secoes": {}}
    for chave, (grupo, campo) in TEXTOS.items():
        dados[grupo][campo] = v.get(chave, "")
    dados["seo"].update({"google_analytics": "", "search_console": ""})

    m = re.search(r'data-c-whatsapp="evento.mensagem"[^>]*\bhref="[^"]*\?text=([^"]*)"', src, re.S)
    c = ler_conteudo_js()
    ev = c.get("evento") or {}
    dados["evento"].update({
        "mostrar": bool(ev.get("ativo")),
        "ate": (ev.get("dataFim") or "")[:10],
        "mensagem": urllib.parse.unquote(html.unescape(m.group(1))) if m else "",
    })
    dados["horario"] = c.get("horario") or []

    bloco = src[src.index("<!-- vitrine:inicio -->"):src.index("<!-- vitrine:fim -->")]
    bloco1 = bloco.split("bloco 2")[0]
    dados["vitrine"] = [
        {"foto": "/" + html.unescape(s), "descricao": re.sub(r"\s+", " ", html.unescape(a)).strip()}
        for s, a in re.findall(r'<img src="([^"]+)"[^>]*?alt="([^"]*)"', bloco1, re.S)
    ]
    dados["depoimentos"] = [{"nome": d["nome"], "texto": d["texto"], "nota": d.get("nota", 5)}
                            for d in c.get("depoimentos") or []]
    g = c.get("google") or {}
    dados["google"] = {"nota": g.get("nota"), "avaliacoes": g.get("avaliacoes"), "link": g.get("url", "")}

    PASTA_CONTEUDO.mkdir(exist_ok=True)
    for area, lista in AREAS.items():
        valor = {lista: dados[area]} if lista else dados[area]
        (PASTA_CONTEUDO / f"{area}.json").write_text(
            json.dumps(valor, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"Criados os arquivos em {PASTA_CONTEUDO.relative_to(RAIZ)}/")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--iniciar", action="store_true", help="cria conteudo/*.json a partir do site atual")
    a = ap.parse_args()
    if a.iniciar:
        iniciar()
        return 0
    try:
        mudou, avisos = aplicar()
    except ErroConteudo as e:
        print(f"::error::Conteúdo não aplicado, site mantido como está: {e}")
        return 1
    for av in avisos:
        print(f"::warning::{av}")
    print("Alterado: " + ", ".join(mudou) if mudou else "Nada a alterar.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
