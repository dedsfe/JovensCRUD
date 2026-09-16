import { useMemo } from 'react'
import {
  assessPassword,
  MIN_PASSWORD_LENGTH,
} from '../helpers/passwordStrength'
import styles from './PasswordStrength.module.css'

interface PasswordStrengthProps {
  password: string
}

const formatList = (items: string[]): string => {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const assessment = useMemo(() => assessPassword(password), [password])
  const remainingCharacters = Math.max(MIN_PASSWORD_LENGTH - password.length, 0)
  const missingRequirements = assessment.requirements
    .filter(({ key, met }) => key !== 'length' && !met)
    .map(({ label }) => label)
  const characterGuidance =
    remainingCharacters === 1
      ? 'Falta 1 caractere.'
      : remainingCharacters > 1
        ? `Faltam ${remainingCharacters} caracteres.`
        : ''
  const requirementGuidance = missingRequirements.length
    ? `${remainingCharacters ? ' Inclua também' : 'Ainda falta'}: ${formatList(missingRequirements)}.`
    : ''
  const guidance =
    characterGuidance || requirementGuidance
      ? `${characterGuidance}${requirementGuidance}`
      : 'Sua senha está forte.'

  return (
    <div className={styles.root} data-score={assessment.score}>
      <div className={styles.summary}>
        <span>Força da senha</span>
        <strong>{assessment.label}</strong>
      </div>
      <div className={styles.meter} aria-hidden="true">
        {[0, 1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={styles.segment}
            data-active={segment < assessment.score}
          />
        ))}
      </div>
      <p aria-live="polite" aria-atomic="true">
        {guidance}
      </p>
    </div>
  )
}

export default PasswordStrength
