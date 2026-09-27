import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import Features from '../components/Features.jsx'
import Menu from '../components/Menu.jsx'
import HowItWorks from '../components/HowItWorks.jsx'
import Location from '../components/Location.jsx'
import Footer from '../components/Footer.jsx'
import CartButton from '../components/CartButton.jsx'
import CartDrawer from '../components/CartDrawer.jsx'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <Menu />
        <HowItWorks />
        <Location />
      </main>
      <Footer />
      <CartButton />
      <CartDrawer />
    </>
  )
}
