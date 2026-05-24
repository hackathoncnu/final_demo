interface Chip {
  id: string
  label: string
}

interface Group {
  name: string
  chips: Chip[]
  selected: string
  onSelect: (id: string) => void
}

interface Props {
  groups: Group[]
}

export default function ChipFilter({ groups }: Props) {
  return (
    <div className="space-y-3">
      {groups.map(group => (
        <div key={group.name} className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider min-w-[40px]">
            {group.name}
          </span>
          <div className="flex gap-2 flex-wrap">
            {group.chips.map(chip => {
              const active = group.selected === chip.id
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => group.onSelect(chip.id)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors border ${
                    active
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface text-text-primary border-border-warm hover:border-primary hover:text-primary'
                  }`}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
