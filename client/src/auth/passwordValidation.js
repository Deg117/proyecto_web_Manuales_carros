export const PASSWORD_REQUIREMENTS = Object.freeze([
  {
    id: 'length',
    label: 'Al menos 8 caracteres',
    isMet: password => password.length >= 8,
  },
  {
    id: 'letter',
    label: 'Al menos una letra',
    isMet: password => /\p{L}/u.test(password),
  },
  {
    id: 'number',
    label: 'Al menos un número',
    isMet: password => /\d/.test(password),
  },
])

export function getPasswordRequirements(password) {
  return PASSWORD_REQUIREMENTS.map(({ id, label, isMet }) => ({
    id,
    label,
    met: isMet(password),
  }))
}

export function isValidPassword(password) {
  return getPasswordRequirements(password).every(requirement => requirement.met)
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
