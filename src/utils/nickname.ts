export const NICKNAME_RULE_MESSAGE =
  '영문 소문자, 숫자, 마침표(.), 밑줄(_)만 3~30자로 사용할 수 있으며 처음과 끝은 영문 또는 숫자여야 합니다.'

const NICKNAME_PATTERN = /^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$/

export function formatNicknameInput(value: string): string {
  return value.trimStart().replace(/^@+/, '').toLowerCase()
}

export function getNicknameValidationError(value: string): string {
  const nickname = value.trim()
  if (!nickname) return '닉네임은 3~30자로 입력해 주세요.'
  if (nickname.length < 3 || nickname.length > 30) {
    return NICKNAME_RULE_MESSAGE
  }
  if (!NICKNAME_PATTERN.test(nickname) || nickname.includes('..')) {
    return NICKNAME_RULE_MESSAGE
  }
  return ''
}
