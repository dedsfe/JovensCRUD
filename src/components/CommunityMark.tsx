interface CommunityMarkProps {
  className?: string
}

const CommunityMark: React.FC<CommunityMarkProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 42 42"
    role="img"
    aria-label="Comunidade de jovens"
  >
    <path
      d="M8 26.5C8 18.7 13.8 12 21 12s13 6.7 13 14.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <path
      d="M13 30c2.7-4.2 5.4-6.3 8-6.3s5.3 2.1 8 6.3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <circle cx="21" cy="9" r="3" fill="currentColor" />
  </svg>
)

export default CommunityMark
