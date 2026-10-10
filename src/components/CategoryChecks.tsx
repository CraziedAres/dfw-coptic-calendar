import { CATEGORIES, GROUPS } from "@/lib/categories";
import { shortChurchName } from "@/lib/site";

/** Grouped category checkboxes, submitted as repeated `categories` form fields. */
export function CategoryChecks({ selected, legend = "Categories" }: { selected?: string[]; legend?: string }) {
  const on = new Set(selected ?? []);
  return (
    <fieldset>
      <legend>{legend}</legend>
      {GROUPS.map((g) => (
        <div key={g.id} style={{ marginBottom: "0.75rem" }}>
          <div className="small-caps" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
            {g.label}
          </div>
          <div className="check-grid">
            {CATEGORIES.filter((c) => c.group === g.id).map((c) => (
              <label key={c.slug}>
                <input type="checkbox" name="categories" value={c.slug} defaultChecked={on.has(c.slug)} />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}

export function ChurchChecks({ churches, selected }: { churches: { id: string; name: string }[]; selected?: string[] }) {
  const on = new Set(selected ?? []);
  return (
    <fieldset>
      <legend>Churches</legend>
      <p className="muted" style={{ marginTop: 0 }}>Leave all unchecked to hear about every church.</p>
      <div className="check-grid">
        {churches.map((c) => (
          <label key={c.id}>
            <input type="checkbox" name="church_ids" value={c.id} defaultChecked={on.has(c.id)} />
            {shortChurchName(c.name)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
