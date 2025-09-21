import { Injectable } from "@angular/core"
import { BehaviorSubject, map } from "rxjs"

type Counts = Record<string, number>

@Injectable({ providedIn: "root" })
export class GlobalReactionService {
  private counts$ = new BehaviorSubject<Counts>({})

  increment(emoji: string, by = 1): void {
    const cur = this.counts$.value
    const next = { ...cur, [emoji]: (cur[emoji] || 0) + by }
    this.counts$.next(next)
  }

  setCounts(all: Counts): void {
    this.counts$.next({ ...all })
  }

  topN$(n = 2) {
    return this.counts$.pipe(map(c => this.sort(c).slice(0, n)))
  }

  private sort(c: Counts): string[] {
    return Object.entries(c)
      .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
      .map(([e]) => e)
  }
}
