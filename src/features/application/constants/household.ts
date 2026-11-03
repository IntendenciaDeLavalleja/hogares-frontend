import type { ParentSituation } from '../types/application'

export const PARENT_SITUATIONS: Record<ParentSituation, string> = {
  lives_with: 'Convive conmigo',
  outside: 'No convive conmigo; puedo aportar sus datos',
  deceased: 'Falleció',
  unknown: 'No conozco sus datos',
  no_contact: 'No tengo vínculo o contacto y no puedo aportar sus datos',
}
