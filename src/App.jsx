import Header from './components/Header'
import Hero from './components/Hero'
import Intro from './components/Intro'
import GigCalendar from './components/GigCalendar'
import MediaGallery from './components/MediaGallery'
import References from './components/References'
import ContactForm from './components/ContactForm'
import Footer from './components/Footer'
import GigInquiryBar from './components/GigInquiryBar'

function App() {
  return (
    <>
      <Header />
      <main className="pb-[4.5rem] sm:pb-[4.25rem]">
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
      <GigInquiryBar />
    </>
  )
}

export default App
