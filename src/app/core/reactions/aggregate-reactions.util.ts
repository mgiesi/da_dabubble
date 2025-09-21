export type ReactionCounts = Record<string, number>

export function aggregateReactions(messages: any[] | null | undefined): ReactionCounts {
  if (!messages?.length) return {}
  return messages.reduce((acc: ReactionCounts, msg: any) => {
    const r = msg?.reactions
    if (!r) return acc
    if (Array.isArray(r)) return sumArray(acc, r)
    return sumObject(acc, r)
  }, {})
}

function sumArray(acc: ReactionCounts, arr: any[]): ReactionCounts {
  for (const it of arr) {
    const k = it?.emoji ?? it?.key ?? it?.id
    const c = Number(it?.count ?? it?.value ?? 0)
    if (k && c) acc[k] = (acc[k] || 0) + c
  }
  return acc
}

function sumObject(acc: ReactionCounts, obj: any): ReactionCounts {
  for (const [k, v] of Object.entries(obj)) {
    const c = Number((v && typeof v === "object") ? (v as any).count : v)
    if (k && c) acc[k] = (acc[k] || 0) + c
  }
  return acc
}
