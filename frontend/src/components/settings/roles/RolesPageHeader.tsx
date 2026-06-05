type RolesPageHeaderProps = {
  onCreate: () => void;
  canManage: boolean;
};

export function RolesPageHeader({ onCreate, canManage }: RolesPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="fm-settings-roles__title-icon" aria-hidden>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">Roles & permissions</h1>
          <p className="mt-1 text-sm text-ink-muted">Manage role access across your organization.</p>
        </div>
      </div>
      {canManage && (
        <button type="button" className="fm-settings-roles__header-cta shrink-0" onClick={onCreate}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create role
        </button>
      )}
    </header>
  );
}
