import { btnSecondary } from "../../../theme/classNames";

type UsersPageHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
  showForm: boolean;
  onToggleForm: () => void;
};

export function UsersPageHeader({
  search,
  onSearchChange,
  filtersOpen,
  onToggleFilters,
  hasActiveFilters,
  showForm,
  onToggleForm,
}: UsersPageHeaderProps) {
  return (
    <header>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="fm-settings-users__title-icon" aria-hidden>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">Users</h1>
            <p className="mt-1 text-sm text-ink-muted">Manage organization users and roles.</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:ml-auto lg:w-auto lg:shrink-0">
          <div className="relative min-w-0 w-full flex-1 lg:w-[380px] lg:max-w-[380px]">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" strokeWidth={1.75} />
              <path strokeLinecap="round" strokeWidth={1.75} d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              className="fm-settings-users__header-search"
              placeholder="Search users..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`${btnSecondary} fm-settings-users__filter-btn !min-h-[40px] !px-3 !py-2 !text-sm ${
                filtersOpen || hasActiveFilters ? "ring-2 ring-brand/20" : ""
              }`}
              onClick={onToggleFilters}
              aria-expanded={filtersOpen}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M6 12h12M8 18h8" />
              </svg>
              Filter
            </button>

            <button
              type="button"
              className={`fm-settings-users__header-cta shrink-0 ${showForm ? "fm-settings-users__header-cta--cancel" : ""}`}
              onClick={onToggleForm}
            >
              {!showForm && (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              {showForm ? "Cancel" : "Add user"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
