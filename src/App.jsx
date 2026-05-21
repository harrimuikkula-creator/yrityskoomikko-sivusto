import Header from './components/Header'
import Hero from './components/Hero'
import Intro from './components/Intro'
import GigCalendar from './components/GigCalendar'
import MediaGallery from './components/MediaGallery'
import References from './components/References'
import ContactForm from './components/ContactForm'
import Footer from './components/Footer'

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <div className="section-divider" />
        <Intro />
        <div className="section-divider" />
        <GigCalendar />
        <MediaGallery />
        <References />
        <ContactForm />
      </main>
      <Footer />
    </>
  )
}

export default App
