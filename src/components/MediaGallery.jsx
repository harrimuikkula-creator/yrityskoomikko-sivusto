import { useLanguage } from '../i18n/LanguageContext'
import SectionHeading from './ui/SectionHeading'

function parseYouTubeId(idOrUrl) {
  if (!idOrUrl) return null
  const trimmed = idOrUrl.trim()
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  )
  return match?.[1] ?? null
}

function parseVimeoId(idOrUrl) {
  if (!idOrUrl) return null
  const trimmed = idOrUrl.trim()
  if (/^\d+$/.test(trimmed)) return trimmed
  const match = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match?.[1] ?? null
}

function VideoEmbed({ video, emptyVideoHint }) {
  const youtubeId =
    video.platform === 'youtube' ? parseYouTubeId(video.videoId) : null
  const vimeoId = video.platform === 'vimeo' ? parseVimeoId(video.videoId) : null
  const hasFile = video.platform === 'file' && video.src

  if (!youtubeId && !vimeoId && !hasFile) {
    return (
      <div className="overflow-hidden rounded-sm border border-dashed border-olive-700 bg-olive-900/50">
        <div className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center">
          <svg
            className="h-12 w-12 text-olive-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.113z"
            />
          </svg>
          <p className="text-sm text-olive-400">{emptyVideoHint}</p>
        </div>
        <p className="border-t border-olive-800 px-4 py-3 text-sm font-medium text-cream-muted">
          {video.title}
        </p>
      </div>
    )
  }

  if (hasFile) {
    return (
      <div className="group overflow-hidden rounded-sm border border-olive-800 bg-olive-900">
        <div className="aspect-video">
          <video
            src={video.src}
            controls
            playsInline
            className="h-full w-full bg-olive-950 object-contain"
            title={video.title}
          />
        </div>
        <p className="border-t border-olive-800 px-4 py-3 text-sm font-medium text-cream-muted transition-colors group-hover:text-gold-300">
          {video.title}
        </p>
      </div>
    )
  }

  const embedUrl = vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}`
    : `https://www.youtube.com/embed/${youtubeId}`

  return (
    <div className="group overflow-hidden rounded-sm border border-olive-800 bg-olive-900">
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          title={video.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className="border-t border-olive-800 px-4 py-3 text-sm font-medium text-cream-muted transition-colors group-hover:text-gold-300">
        {video.title}
      </p>
    </div>
  )
}

function ImageCard({ image }) {
  return (
    <figure className="group overflow-hidden rounded-sm border border-olive-800 bg-olive-900">
      <div className="aspect-[4/3] overflow-hidden">
        {image.src ? (
          <img
            src={image.src}
            alt={image.alt}
            className="h-full w-full object-cover object-[center_22%] transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-olive-800 to-olive-950">
            <svg
              className="h-12 w-12 text-olive-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
        )}
      </div>
      {image.caption && (
        <figcaption className="border-t border-olive-800 px-4 py-3 text-sm text-cream-muted">
          <span className="block">{image.caption}</span>
        </figcaption>
      )}
    </figure>
  )
}

function VideoSection({ title, videos, columns = 'two', emptyVideoHint }) {
  if (!videos?.length) return null

  const gridClass =
    columns === 'three'
      ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid gap-6 sm:grid-cols-2'

  return (
    <div className="mb-14 last:mb-0">
      <h3 className="mb-6 text-lg font-semibold tracking-tight text-cream md:text-xl">
        {title}
      </h3>
      <div className={gridClass}>
        {videos.map((video) => (
          <VideoEmbed
            key={video.id ?? video.title}
            video={video}
            emptyVideoHint={emptyVideoHint}
          />
        ))}
      </div>
    </div>
  )
}

export default function MediaGallery() {
  const { content } = useLanguage()
  const { media } = content
  const longVideos = media.longGigVideos ?? media.videos ?? []
  const shortClips = media.shortClips ?? []

  return (
    <section id="media" className="section-padding border-t border-olive-800/40">
      <div className="mx-auto max-w-content">
        <SectionHeading
          eyebrow={media.eyebrow}
          title={media.title}
          subtitle={media.subtitle}
          className="mb-14"
        />

        <VideoSection
          title={media.longVideosTitle}
          videos={longVideos}
          columns="two"
          emptyVideoHint={media.addVideoLink}
        />
        <VideoSection
          title={media.shortClipsTitle}
          videos={shortClips}
          columns="three"
          emptyVideoHint={media.addVideoLink}
        />

        <div>
          <h3 className="mb-6 text-lg font-semibold tracking-tight text-cream md:text-xl">
            {media.imagesTitle}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {media.images.map((image, index) => (
              <ImageCard
                key={`${image.src ?? 'placeholder'}-${image.caption ?? index}`}
                image={image}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
