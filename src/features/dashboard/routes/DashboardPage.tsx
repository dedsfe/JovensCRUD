import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useYouths } from '../../youth/context/useYouths'
import {
  getBirthdayDetails,
  getWhatsAppUrl,
  type BirthdayDetails,
} from '../../youth/helpers/youthHelpers'
import type { Youth } from '../../youth/types/youth'
import styles from './DashboardPage.module.css'

const WhatsAppGlyph: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2s-.8 1-1 1.2c-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5s-.7-1.7-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.9c0 1.7 1.2 3.3 1.4 3.5.2.2 2.4 3.7 5.8 5.1.8.3 1.4.5 1.9.7.8.2 1.6.2 2.2.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.6.2-1.7-.1-.2-.3-.3-.6-.5Z" />
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Z" />
  </svg>
)

interface BirthdayPerson {
  person: Youth
  details: BirthdayDetails
}

const DashboardPage: React.FC = () => {
  const { youths, access, isLoading, error } = useYouths()
  const activeYouth = youths.filter(({ status }) => status === 'active')
  const inactiveYouth = youths.length - activeYouth.length
  const recentYouth = youths.slice(0, 4)
  const directoryAvailable = access?.canManage === true && !error
  const metricValue = (value: number): string =>
    isLoading || !directoryAvailable ? '–' : String(value)

  const currentMonthName = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())
  }, [])

  const monthBirthdays = useMemo<BirthdayPerson[]>(() => {
    return youths
      .map((person) => {
        const details = getBirthdayDetails(person.birthDate)
        return details?.isCurrentMonth ? { person, details } : null
      })
      .filter((item): item is BirthdayPerson => item !== null)
      .sort((a, b) => a.details.day - b.details.day)
  }, [youths])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Visão geral</h1>
          <p>Acompanhe a comunidade e os acessos em um só lugar.</p>
        </div>
        <Link className={styles.primaryAction} to="/jovens">
          Ver jovens
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m7 4 6 6-6 6" />
          </svg>
        </Link>
      </header>

      <section className={styles.metrics} aria-label="Resumo do diretório">
        <article>
          <span>Total de jovens</span>
          <strong>{metricValue(youths.length)}</strong>
          <small>{error ? 'dados indisponíveis' : 'cadastros no diretório'}</small>
        </article>
        <article>
          <span>Ativos</span>
          <strong>{metricValue(activeYouth.length)}</strong>
          <small>participando atualmente</small>
        </article>
        <article>
          <span>Aniversariantes</span>
          <strong>{metricValue(monthBirthdays.length)}</strong>
          <small>em {currentMonthName}</small>
        </article>
        <article>
          <span>Inativos</span>
          <strong>{metricValue(inactiveYouth)}</strong>
          <small>precisam de acompanhamento</small>
        </article>
      </section>

      <div className={styles.columns}>
        <div>
          {/* Seção Aniversariantes do Mês */}
          <section className={styles.birthdays} aria-labelledby="birthdays-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="birthdays-title">
                  Aniversariantes de {currentMonthName}
                </h2>
                <p>
                  {isLoading
                    ? 'Buscando aniversariantes...'
                    : monthBirthdays.length === 1
                      ? '1 jovem comemora aniversário este mês.'
                      : monthBirthdays.length > 1
                        ? `${monthBirthdays.length} jovens comemoram aniversário este mês.`
                        : `Nenhum aniversário cadastrado em ${currentMonthName}.`}
                </p>
              </div>
              <Link to="/jovens">Ver diretório</Link>
            </div>

            <ul data-empty={monthBirthdays.length === 0}>
              {monthBirthdays.map(({ person, details }) => {
                const whatsappUrl = getWhatsAppUrl(
                  person.phone,
                  person.preferredName,
                  'birthday',
                )

                return (
                  <li key={person.id}>
                    <span className={styles.personAvatar} aria-hidden="true">
                      {person.photoUrl ? (
                        <img src={person.photoUrl} alt="" />
                      ) : (
                        person.initials
                      )}
                    </span>
                    <span className={styles.personName}>
                      <strong>{person.preferredName}</strong>
                      <small>
                        {details.turningAge
                          ? details.isToday
                            ? `Completando ${details.turningAge} anos hoje`
                            : `Fará ${details.turningAge} anos`
                          : person.fullName}
                      </small>
                    </span>
                    <span
                      className={
                        details.isToday ? styles.todayBadge : styles.birthdayBadge
                      }
                    >
                      {details.isToday ? 'Hoje! 🎉' : `Dia ${details.day}`}
                    </span>
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.whatsappButton}
                        title={`Parabenizar ${person.preferredName} no WhatsApp`}
                        aria-label={`Enviar parabéns para ${person.preferredName} no WhatsApp`}
                      >
                        <WhatsAppGlyph />
                        <span>Parabenizar</span>
                      </a>
                    )}
                  </li>
                )
              })}
              {!isLoading && monthBirthdays.length === 0 && (
                <li className={styles.emptyBirthdays}>
                  Nenhum jovem faz aniversário em {currentMonthName}.
                </li>
              )}
            </ul>
          </section>

          {/* Seção Adicionados Recentemente */}
          <section className={styles.recent} aria-labelledby="recent-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="recent-title">Adicionados recentemente</h2>
                <p>
                  {isLoading
                    ? 'Atualizando o diretório...'
                    : error
                      ? 'Não foi possível atualizar agora.'
                      : 'Últimos cadastros realizados na comunidade.'}
                </p>
              </div>
              <Link to="/jovens">Ver todos</Link>
            </div>

            <ul data-empty={recentYouth.length === 0}>
              {recentYouth.map((person) => (
                <li key={person.id}>
                  <span className={styles.personAvatar} aria-hidden="true">
                    {person.photoUrl ? (
                      <img src={person.photoUrl} alt="" />
                    ) : (
                      person.initials
                    )}
                  </span>
                  <span className={styles.personName}>
                    <strong>{person.preferredName}</strong>
                    <small>{person.fullName}</small>
                  </span>
                  <span
                    className={styles.personStatus}
                    data-active={person.status === 'active'}
                  >
                    {person.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </li>
              ))}
              {!isLoading && recentYouth.length === 0 && (
                <li className={styles.emptyRecent}>
                  {directoryAvailable
                    ? 'Nenhum jovem foi adicionado ainda.'
                    : 'Ative um acesso de liderança para visualizar o diretório.'}
                </li>
              )}
            </ul>
          </section>
        </div>

        <aside className={styles.access} aria-labelledby="access-title">
          <div className={styles.accessMark} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <h2 id="access-title">Acessos sob seu controle</h2>
            <p>
              Novas contas entram como membros pendentes. Só um administrador
              pode aprovar ou alterar cargos.
            </p>
          </div>
          <Link to="/acessos">
            Gerenciar acessos
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6 14 14 6M8 6h6v6" />
            </svg>
          </Link>
        </aside>
      </div>
    </div>
  )
}

export default DashboardPage
