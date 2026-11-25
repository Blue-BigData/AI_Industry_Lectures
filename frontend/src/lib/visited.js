const KEY = 'visited'

export const getVisited = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

export const markVisited = (id) => {
  const set = new Set(getVisited())
  set.add(Number(id))
  localStorage.setItem(KEY, JSON.stringify([...set]))
}