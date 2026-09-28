#!/usr/bin/env python3
"""Atualiza o site a partir da planilha Google do cliente.

A planilha tem uma aba "Site" com as colunas Área | O que é | Conteúdo | Dica |
Chave. O script lê essa aba publicada como CSV, valida cada valor e aplica:

  * textos do index.html marcados com data-c="<chave>" (e data-c-whatsapp
    para o link do botão da faixa de evento);
  * assets/js/conteudo.js, com faixa de evento, horário, depoimentos e selo do
    Google, lido pelo main.js.

Nada é apagado por engano: texto vazio mantém o que já está no site; só as
listas (horário, depoimentos) usam a linha vazia para remover um item. Se a
planilha não abrir, vier sem as colunas certas ou com poucas chaves
reconhecidas, o script não mexe em nada.

Uso:
  python3 scripts/planilha.py                 # lê o link de .github/planilha.txt
  python3 scripts/planilha.py --csv arq.csv   # lê um CSV local (testes)
  python3 scripts/planilha.py --modelo saida.xlsx   # gera o modelo preenchido
                                                    # com o que está no site hoje
"""

import argparse
import csv
import html
import io
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
INDEX = RAIZ / "index.html"
CONTEUDO_JS = RAIZ / "assets" / "js" / "conteudo.js"
MAIN_JS = RAIZ / "assets" / "js" / "main.js"
LINK_PLANILHA = RAIZ / ".github" / "planilha.txt"

MAX_HORARIOS = 4
MAX_DEPOIMENTOS = 6
LIMITE_TEXTO = 600

# (chave, área, o que é, dica). A ordem aqui é a ordem das linhas da planilha.
CAMPOS = [
    ("seo.titulo", "Google", "Título na busca do Google",
     "Até 60 caracteres. Comece pelo nome da loja ou pelo que as pessoas buscam."),
    ("seo.descricao", "Google", "Descrição na busca do Google",
     "Até 155 caracteres. Aparece abaixo do título no resultado da busca."),
    ("previa.titulo", "Google", "Título da prévia do link (WhatsApp, Instagram)",
     "Aparece quando alguém compartilha o link do site."),
    ("previa.descricao", "Google", "Descrição da prévia do link",
     "Aparece abaixo do título na prévia do link. Pode levar alguns dias para atualizar nos aplicativos."),

    ("topo.chamada", "Topo", "Linha pequena acima do título",
     "Curta, em letras maiúsculas no site."),
    ("topo.titulo", "Topo", "Título principal",
     "Coloque uma palavra entre asteriscos para ela sair em itálico dourado. Ex.: Seu estilo *começa* no olhar"),
    ("topo.texto", "Topo", "Texto abaixo do título", "Uma ou duas frases."),

    ("evento.mostrar", "Faixa de evento", "Mostrar a faixa?",
     "Sim ou Não. Mesmo com Sim, a faixa some sozinha depois da data abaixo."),
    ("evento.ate", "Faixa de evento", "Mostrar até o dia",
     "Formato dd/mm/aaaa. A faixa some depois das 23:59 desse dia."),
    ("evento.titulo", "Faixa de evento", "Título da faixa", "Ex.: Convite especial · Inauguração 26/09"),
    ("evento.texto", "Faixa de evento", "Texto da faixa", "Ex.: Sábado, a partir das 10h · Av. Floriano Peixoto, 818"),
    ("evento.botao", "Faixa de evento", "Texto do botão", "Ex.: Confirmar presença"),
    ("evento.mensagem", "Faixa de evento", "Mensagem que o cliente envia pelo WhatsApp ao clicar no botão",
     "Ex.: Olá! Vim pelo site e quero confirmar presença."),
]
for i in range(1, MAX_HORARIOS + 1):
    CAMPOS += [
        (f"horario.{i}.dias", "Horário", f"Horário {i} — dias",
         "Ex.: Segunda a sexta. Deixe dias e horas em branco para não mostrar esta linha."),
        (f"horario.{i}.horas", "Horário", f"Horário {i} — horas", "Ex.: 9h às 18h"),
    ]
CAMPOS += [
    ("secao.diferenciais", "Títulos das seções", "Diferenciais", ""),
    ("secao.ivision", "Títulos das seções", "iVision", ""),
    ("secao.marcas", "Títulos das seções", "Marcas e coleções", ""),
    ("secao.vitrine", "Títulos das seções", "Vitrine", ""),
    ("secao.depoimentos", "Títulos das seções", "Depoimentos", ""),
    ("secao.missao", "Títulos das seções", "Missão e visão", ""),
    ("secao.valores", "Títulos das seções", "Valores", ""),
    ("secao.localizacao", "Títulos das seções", "Localização", ""),
    ("secao.agendamento", "Títulos das seções", "Agendamento", ""),
]
for i in range(1, MAX_DEPOIMENTOS + 1):
    CAMPOS += [
        (f"depoimento.{i}.nome", "Depoimentos", f"Depoimento {i} — nome",
         "Só com autorização do cliente. Nome e texto em branco = não mostrar."),
        (f"depoimento.{i}.texto", "Depoimentos", f"Depoimento {i} — texto", ""),
        (f"depoimento.{i}.nota", "Depoimentos", f"Depoimento {i} — nota", "De 1 a 5. Em branco = 5."),
    ]
CAMPOS += [
    ("google.nota", "Selo do Google", "Nota no Google", "Ex.: 4,9. Em branco = o selo não aparece."),
    ("google.avaliacoes", "Selo do Google", "Número de avaliações", "Ex.: 87"),
    ("google.link", "Selo do Google", "Link do perfil no Google",
     "Começa com https://. Em branco = o selo não aparece."),
]
CHAVES = {c[0] for c in CAMPOS}


class ErroPlanilha(Exception):
    pass


# ---------------------------------------------------------------- leitura

def link_csv(link):
    """Aceita o link de 'Publicar na Web' (CSV ou página) ou o link comum."""
    link = link.strip()
    if "/pubhtml" in link:
        link = link.replace("/pubhtml", "/pub")
    if "/pub" in link:
        partes = urllib.parse.urlsplit(link)
        q = dict(urllib.parse.parse_qsl(partes.query))
        q["output"] = "csv"
        return urllib.parse.urlunsplit(partes._replace(query=urllib.parse.urlencode(q)))
    m = re.search(r"/spreadsheets/d/([\w-]+)", link)
    if m:
        gid = re.search(r"[#&?]gid=(\d+)", link)
        return (f"https://docs.google.com/spreadsheets/d/{m.group(1)}/export?format=csv"
                + (f"&gid={gid.group(1)}" if gid else ""))
    return link


def baixar(link):
    req = urllib.request.Request(link_csv(link), headers={"User-Agent": "noblesse-site"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            dados = r.read()
    except Exception as e:  # rede, 404, planilha despublicada
        raise ErroPlanilha(f"não consegui abrir a planilha: {e}")
    texto = dados.decode("utf-8-sig", errors="replace")
    if texto.lstrip().startswith("<"):
        raise ErroPlanilha("o link devolveu uma página, não a planilha. "
                           "Confira se ela está em Arquivo > Compartilhar > Publicar na Web.")
    return texto


def ler_csv(texto):
    linhas = list(csv.reader(io.StringIO(texto)))
    if not linhas:
        raise ErroPlanilha("planilha vazia")
    cab = [c.strip().lower() for c in linhas[0]]

    def coluna(nome):
        for i, c in enumerate(cab):
            if c.startswith(nome):
                return i
        raise ErroPlanilha(f'coluna "{nome}" não encontrada no cabeçalho: {linhas[0]}')

    i_chave, i_valor = coluna("chave"), coluna("conte")
    valores = {}
    for ln in linhas[1:]:
        if len(ln) <= max(i_chave, i_valor):
            continue
        chave = ln[i_chave].strip()
        if chave in CHAVES:
            valores[chave] = ln[i_valor].strip()[:LIMITE_TEXTO]
    if len(valores) < len(CHAVES) // 2:
        raise ErroPlanilha(f"só {len(valores)} de {len(CHAVES)} linhas reconhecidas — "
                           "a coluna Chave foi alterada ou o link é de outra aba.")
    return valores


# ------------------------------------------------------------- validação

def data_br(txt):
    m = re.fullmatch(r"(\d{1,2})/(\d{1,2})/(\d{4})", txt.strip())
    if not m:
        return None
    try:
        return date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    except ValueError:
        return None


def numero(txt):
    try:
        return float(txt.replace(",", ".").strip())
    except ValueError:
        return None


def montar_conteudo(v, atual, avisos):
    """Gera o dicionário do conteudo.js. Valor inválido mantém o atual."""
    ev = dict(atual.get("evento") or {"ativo": False, "dataFim": ""})
    mostrar = v.get("evento.mostrar", "").strip().lower()
    if mostrar in ("sim", "s", "yes"):
        ev["ativo"] = True
    elif mostrar in ("não", "nao", "n", "no"):
        ev["ativo"] = False
    elif mostrar:
        avisos.append(f'"Mostrar a faixa?" deve ser Sim ou Não (veio "{mostrar}"): mantido.')
    ate = v.get("evento.ate", "")
    if ate:
        d = data_br(ate)
        if d:
            ev["dataFim"] = f"{d.isoformat()}T23:59:59"
        else:
            avisos.append(f'"Mostrar até o dia" deve ser dd/mm/aaaa (veio "{ate}"): mantido.')

    horario = []
    for i in range(1, MAX_HORARIOS + 1):
        dias, horas = v.get(f"horario.{i}.dias", ""), v.get(f"horario.{i}.horas", "")
        if dias and horas:
            horario.append({"dias": dias, "horas": horas})
        elif dias or horas:
            avisos.append(f"Horário {i}: preencha dias E horas — linha ignorada.")

    depoimentos = []
    for i in range(1, MAX_DEPOIMENTOS + 1):
        nome, texto = v.get(f"depoimento.{i}.nome", ""), v.get(f"depoimento.{i}.texto", "")
        if not (nome and texto):
            if nome or texto:
                avisos.append(f"Depoimento {i}: preencha nome E texto — ignorado.")
            continue
        nota = numero(v.get(f"depoimento.{i}.nota", "") or "5")
        if nota is None or not 1 <= nota <= 5:
            avisos.append(f"Depoimento {i}: nota deve ser de 1 a 5 — usei 5.")
            nota = 5
        depoimentos.append({"nome": nome, "texto": texto, "nota": round(nota), "foto": None})

    google = {"nota": None, "avaliacoes": None, "url": ""}
    nota, link = v.get("google.nota", ""), v.get("google.link", "")
    if nota or link:
        n = numero(nota)
        if n is None or not 0 < n <= 5:
            avisos.append(f'Selo do Google: nota inválida ("{nota}") — selo não exibido.')
        elif not link.startswith("https://"):
            avisos.append("Selo do Google: o link deve começar com https:// — selo não exibido.")
        else:
            av = numero(v.get("google.avaliacoes", "") or "")
            google = {"nota": n, "avaliacoes": int(av) if av else None, "url": link}

    return {"evento": ev, "horario": horario, "depoimentos": depoimentos, "google": google}


# --------------------------------------------------------------- escrita

def _texto_html(valor, italico):
    t = html.escape(valor, quote=False)
    if italico:
        t = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", t)
    return t


def _texto_do_html(trecho):
    """Texto puro de um trecho do HTML, com <em> virando *asteriscos*."""
    t = re.sub(r"</?em>", "*", trecho)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    return re.sub(r"\s+", " ", t).strip()


def aplicar_html(src, v, whatsapp, avisos):
    for chave, valor in v.items():
        if not (chave.startswith(("seo.", "previa.", "topo.", "secao.")) or chave in (
                "evento.titulo", "evento.texto", "evento.botao")):
            continue
        if not valor:
            continue  # vazio = mantém o texto atual
        # <meta ... data-c="chave" ... content="...">
        pad_meta = re.compile(r'(<meta\b[^>]*\bdata-c="%s"[^>]*\bcontent=")[^"]*(")' % re.escape(chave))
        if pad_meta.search(src):
            src = pad_meta.sub(lambda m: m.group(1) + html.escape(valor, quote=True) + m.group(2), src)
            continue
        pad = re.compile(r'(<(\w+)\b[^>]*\bdata-c="%s"[^>]*>)(.*?)(</\2>)' % re.escape(chave), re.S)
        if not pad.search(src):
            avisos.append(f"Chave {chave} não encontrada no index.html.")
            continue
        if _texto_do_html(pad.search(src).group(3)) == valor:
            continue  # já está igual: não reformata o HTML à toa
        novo = _texto_html(valor, italico=(chave == "topo.titulo"))
        src = pad.sub(lambda m: m.group(1) + novo + m.group(4), src, count=1)

    msg = v.get("evento.mensagem", "")
    if msg:
        url = f"https://wa.me/{whatsapp}?text=" + urllib.parse.quote(msg, safe="")
        pad = re.compile(r'(<a\b[^>]*\bdata-c-whatsapp="evento.mensagem"[^>]*\bhref=")([^"]*)(")', re.S)
        m = pad.search(src)
        atual = urllib.parse.unquote(html.unescape(m.group(2)).partition("?text=")[2]) if m else None
        if m and atual != msg:
            src = pad.sub(lambda m: m.group(1) + html.escape(url, quote=True) + m.group(3), src)
    return src


def gerar_conteudo_js(conteudo):
    corpo = json.dumps(conteudo, ensure_ascii=False, indent=2)
    return ("/* GERADO AUTOMATICAMENTE a partir da planilha do site (scripts/planilha.py).\n"
            "   Não edite à mão: a próxima atualização sobrescreve este arquivo. */\n"
            f"window.NOBLESSE_CONTEUDO = {corpo};\n")


def ler_conteudo_atual():
    if not CONTEUDO_JS.exists():
        return {}
    m = re.search(r"window\.NOBLESSE_CONTEUDO\s*=\s*(\{.*\});", CONTEUDO_JS.read_text("utf-8"), re.S)
    return json.loads(m.group(1)) if m else {}


def numero_whatsapp():
    m = re.search(r"whatsapp:\s*'(\d+)'", MAIN_JS.read_text("utf-8"))
    return m.group(1) if m else "5534997202967"


def atualizar(valores):
    avisos = []
    atual = ler_conteudo_atual()
    novo_html = aplicar_html(INDEX.read_text("utf-8"), valores, numero_whatsapp(), avisos)
    novo_js = gerar_conteudo_js(montar_conteudo(valores, atual, avisos))
    mudou = []
    if novo_html != INDEX.read_text("utf-8"):
        INDEX.write_text(novo_html, "utf-8")
        mudou.append("index.html")
    if not CONTEUDO_JS.exists() or novo_js != CONTEUDO_JS.read_text("utf-8"):
        CONTEUDO_JS.write_text(novo_js, "utf-8")
        mudou.append("assets/js/conteudo.js")
    return mudou, avisos


# -------------------------------------------------- valores atuais (modelo)

def valores_do_site():
    """Lê o que está publicado hoje, para pré-preencher o modelo da planilha."""
    src = INDEX.read_text("utf-8")
    v = {}
    for m in re.finditer(r'<meta\b[^>]*\bdata-c="([\w.]+)"[^>]*\bcontent="([^"]*)"', src):
        v[m.group(1)] = html.unescape(m.group(2))
    for m in re.finditer(r'<(\w+)\b[^>]*\bdata-c="([\w.]+)"[^>]*>(.*?)</\1>', src, re.S):
        v[m.group(2)] = _texto_do_html(m.group(3))
    m = re.search(r'data-c-whatsapp="evento.mensagem"[^>]*\bhref="[^"]*\?text=([^"]*)"', src, re.S)
    if m:
        v["evento.mensagem"] = urllib.parse.unquote(html.unescape(m.group(1)))

    c = ler_conteudo_atual()
    ev = c.get("evento") or {}
    v["evento.mostrar"] = "Sim" if ev.get("ativo") else "Não"
    if ev.get("dataFim"):
        a, mth, d = ev["dataFim"][:10].split("-")
        v["evento.ate"] = f"{d}/{mth}/{a}"
    for i, h in enumerate(c.get("horario") or [], 1):
        v[f"horario.{i}.dias"], v[f"horario.{i}.horas"] = h["dias"], h["horas"]
    for i, d in enumerate(c.get("depoimentos") or [], 1):
        v[f"depoimento.{i}.nome"], v[f"depoimento.{i}.texto"] = d["nome"], d["texto"]
        v[f"depoimento.{i}.nota"] = str(d.get("nota", 5))
    g = c.get("google") or {}
    if g.get("url"):
        v["google.nota"] = str(g["nota"]).replace(".", ",")
        v["google.avaliacoes"] = str(g.get("avaliacoes") or "")
        v["google.link"] = g["url"]
    return v


def gerar_modelo(destino):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill

    v = valores_do_site()
    wb = Workbook()
    ws = wb.active
    ws.title = "Site"
    ws.append(["Área", "O que é", "Conteúdo", "Dica", "Chave (não alterar)"])
    for chave, area, rotulo, dica in CAMPOS:
        ws.append([area, rotulo, v.get(chave, ""), dica, chave])

    lilas, cinza = PatternFill("solid", fgColor="E9DDF1"), PatternFill("solid", fgColor="EEEEEE")
    for cel in ws[1]:
        cel.font, cel.fill = Font(bold=True), lilas
    for linha in ws.iter_rows(min_row=2):
        for cel in linha:
            cel.alignment = Alignment(wrap_text=True, vertical="top")
        linha[2].fill = PatternFill("solid", fgColor="FFFDF5")
        linha[3].font = Font(italic=True, color="666666")
        linha[4].font, linha[4].fill = Font(color="999999"), cinza
    for col, larg in zip("ABCDE", (18, 34, 60, 48, 22)):
        ws.column_dimensions[col].width = larg
    ws.freeze_panes = "C2"

    guia = wb.create_sheet("Como usar")
    for ln in [
        "Como atualizar o site da Ótica Noblesse",
        "",
        "1. Altere apenas a coluna Conteúdo da aba Site.",
        "2. Não altere a coluna Chave nem apague linhas: é por ela que o site sabe onde vai cada texto.",
        "3. Texto em branco mantém o que já está no site. Em Horário e Depoimentos, deixar a linha em branco a remove.",
        "4. O site confere a planilha de hora em hora e publica sozinho. Não precisa salvar nem avisar ninguém.",
        "5. Se algo estiver errado (data fora do formato, nota inválida), aquele item é ignorado e o resto é publicado.",
        "6. Endereço, telefone, fotos, cores e layout não mudam por aqui: fale com quem cuida do site.",
    ]:
        guia.append([ln])
    guia["A1"].font = Font(bold=True, size=13)
    guia.column_dimensions["A"].width = 110
    wb.save(destino)


# ------------------------------------------------------------------ main

def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--csv", help="CSV local no lugar da planilha publicada")
    ap.add_argument("--link", help="link da planilha (padrão: .github/planilha.txt)")
    ap.add_argument("--modelo", help="gera o modelo .xlsx com os valores atuais do site")
    a = ap.parse_args()

    if a.modelo:
        gerar_modelo(a.modelo)
        print(f"Modelo gerado: {a.modelo}")
        return 0

    try:
        if a.csv:
            texto = Path(a.csv).read_text("utf-8-sig")
        else:
            link = a.link or (LINK_PLANILHA.read_text("utf-8").strip() if LINK_PLANILHA.exists() else "")
            link = "\n".join(l for l in link.splitlines() if not l.lstrip().startswith("#")).strip()
            if not link:
                print("Nenhuma planilha configurada em .github/planilha.txt — nada a fazer.")
                return 0
            texto = baixar(link)
        mudou, avisos = atualizar(ler_csv(texto))
    except ErroPlanilha as e:
        print(f"::warning::Planilha ignorada, site mantido como está: {e}")
        return 0

    for av in avisos:
        print(f"::warning::{av}")
    print("Alterado: " + ", ".join(mudou) if mudou else "Nenhuma mudança na planilha.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
