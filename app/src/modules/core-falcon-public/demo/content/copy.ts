import type { DemoLocale } from "../data/request";
const en = {
  eyebrow: "LET’S TALK", title: "Book a demo", lead: "Leave your email. We’ll contact you to arrange a meeting and show how Falcon fits your workflow.",
  email: "Email address", placeholder: "you@company.com", submit: "Book a demo", sending: "Sending…",
  consent: "I consent to the processing of my email to arrange a Falcon demo, as described in the", policy: "Privacy Policy", consentEnd: ".",
  note: "Only a conversation about your demo. No marketing subscription or automatic calendar invitation.",
  invalidEmail: "Enter a valid email address.", missingConsent: "Please give your consent before sending your request.",
  success: "Request received. We’ll contact you by email to arrange your demo.",
  invalid: "Check your email and consent, then try again.", rate: "Too many requests. Please wait a few minutes and try again.",
  unavailable: "We couldn’t confirm your request. Try again or email us directly.", contact: "Email us", website: "Leave this field empty",
};
export type DemoCopy = typeof en;
export const demoCopy: Record<DemoLocale, DemoCopy> = {
  en,
  ru: {
    eyebrow: "ДАВАЙТЕ ОБСУДИМ", title: "Записаться на демо", lead: "Оставьте email. Мы свяжемся с вами, чтобы договориться о встрече и показать, как Falcon поможет вашей команде.",
    email: "Электронная почта", placeholder: "you@company.com", submit: "Записаться на демо", sending: "Отправляем…",
    consent: "Я согласен на обработку моего email для организации демо Falcon в соответствии с", policy: "Политикой конфиденциальности", consentEnd: ".",
    note: "Только общение о вашем демо. Без рекламной подписки и автоматического приглашения в календарь.",
    invalidEmail: "Введите корректный email.", missingConsent: "Для отправки заявки необходимо ваше согласие.",
    success: "Заявка получена. Мы напишем вам, чтобы договориться о демо.",
    invalid: "Проверьте email и согласие, затем повторите попытку.", rate: "Слишком много запросов. Подождите несколько минут и попробуйте снова.",
    unavailable: "Не удалось подтвердить получение заявки. Попробуйте ещё раз или напишите нам напрямую.", contact: "Написать нам", website: "Оставьте это поле пустым",
  },
  es: {
    eyebrow: "HABLEMOS", title: "Reserva una demo", lead: "Déjanos tu correo. Te contactaremos para acordar una reunión y mostrarte cómo Falcon se adapta a tu equipo.",
    email: "Correo electrónico", placeholder: "tu@empresa.com", submit: "Reservar una demo", sending: "Enviando…",
    consent: "Consiento el tratamiento de mi correo para organizar una demo de Falcon, según la", policy: "Política de privacidad", consentEnd: ".",
    note: "Solo hablaremos sobre tu demo. Sin suscripción publicitaria ni invitación automática al calendario.",
    invalidEmail: "Introduce un correo válido.", missingConsent: "Necesitamos tu consentimiento para enviar la solicitud.",
    success: "Solicitud recibida. Te escribiremos para acordar tu demo.",
    invalid: "Revisa el correo y el consentimiento e inténtalo de nuevo.", rate: "Demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.",
    unavailable: "No pudimos confirmar tu solicitud. Inténtalo de nuevo o escríbenos directamente.", contact: "Escríbenos", website: "Deja este campo vacío",
  },
  pt: {
    eyebrow: "VAMOS CONVERSAR", title: "Agende uma demonstração", lead: "Deixe seu e-mail. Entraremos em contato para combinar uma reunião e mostrar como o Falcon pode ajudar sua equipe.",
    email: "E-mail", placeholder: "voce@empresa.com", submit: "Agendar demonstração", sending: "Enviando…",
    consent: "Consinto com o tratamento do meu e-mail para organizar uma demonstração do Falcon, conforme a", policy: "Política de privacidade", consentEnd: ".",
    note: "Apenas uma conversa sobre sua demonstração. Sem assinatura de publicidade nem convite automático no calendário.",
    invalidEmail: "Digite um e-mail válido.", missingConsent: "Precisamos do seu consentimento para enviar a solicitação.",
    success: "Solicitação recebida. Escreveremos para combinar sua demonstração.",
    invalid: "Confira o e-mail e o consentimento e tente novamente.", rate: "Muitas solicitações. Aguarde alguns minutos e tente novamente.",
    unavailable: "Não foi possível confirmar sua solicitação. Tente novamente ou escreva diretamente para nós.", contact: "Fale conosco", website: "Deixe este campo vazio",
  },
};
