export default function AnnouncementBar({ text }) {
  return (
    <div className="announce" role="region" aria-label="Announcement">
      <div className="announce__track">
        <div className="announce__group">{text}</div>
        <div className="announce__group" aria-hidden="true">{text}</div>
      </div>
    </div>
  )
}