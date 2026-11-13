const characters = [
  ["mika", "Mika", "Мика"], ["nora", "Nora", "Нора"], ["ray", "Ray", "Рэй"], ["ada", "Ada", "Ада"], ["leo", "Leo", "Лео"],
  ["lina", "Lina", "Лина"], ["omar", "Omar", "Омар"], ["zoe", "Zoe", "Зои"], ["finn", "Finn", "Финн"], ["maya", "Maya", "Майя"],
  ["kai", "Kai", "Кай"], ["iris", "Iris", "Ирис"], ["hugo", "Hugo", "Хьюго"], ["vera", "Vera", "Вера"], ["ivo", "Ivo", "Иво"],
  ["yuna", "Yuna", "Юна"], ["sam", "Sam", "Сэм"], ["eva", "Eva", "Ева"], ["elias", "Elias", "Элиас"], ["ayla", "Ayla", "Айла"],
] as const;
export const avatarCharacters = characters.map(([id, name, nameRu]) => ({ id, name, nameRu, image: `https://saturnusgo.com/falcon/avatars/v2/${id}.webp` }));
export function avatarCharacter(id: string | null | undefined) {
  return avatarCharacters.find(character => character.id === id) ?? null;
}
