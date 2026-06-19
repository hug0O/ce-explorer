export interface TemplateParam {
    placeholder: string;
}

export interface Template {
    name: string;
    prefix?: string;
    description?: string;
    languages?: string[];
    body: string;
    params?: TemplateParam[];
}

export type ParseResult =
    | { ok: true; templates: Template[] }
    | { ok: false; error: string };

export function normalizeBody(body: string[] | string): string {
    return Array.isArray(body) ? body.join('\n') : body;
}

function isValidTemplate(raw: unknown): raw is Record<string, unknown> {
    if (typeof raw !== 'object' || raw === null) return false;
    const obj = raw as Record<string, unknown>;
    return typeof obj.name === 'string' && obj.name.length > 0;
}

function optionalString(v: unknown): string | undefined {
    return typeof v === 'string' ? v : undefined;
}

function parseParams(v: unknown): TemplateParam[] | undefined {
    if (!Array.isArray(v)) return undefined;
    const params: TemplateParam[] = [];
    for (const item of v) {
        if (typeof item === 'object' && item !== null && typeof (item as { placeholder?: unknown }).placeholder === 'string') {
            params.push({ placeholder: (item as { placeholder: string }).placeholder });
        } else if (typeof item === 'string') {
            params.push({ placeholder: item });
        }
    }
    return params.length > 0 ? params : undefined;
}

export function parseTemplateFile(jsonText: string): ParseResult {
    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonText);
    } catch (e) {
        return { ok: false, error: 'Invalid JSON: ' + (e instanceof Error ? e.message : String(e)) };
    }

    if (typeof parsed !== 'object' || parsed === null
        || !Array.isArray((parsed as Record<string, unknown>).templates)) {
        return { ok: false, error: 'Invalid JSON: missing "templates" array' };
    }

    const templates: Template[] = [];
    const entries = (parsed as { templates: unknown[] }).templates;
    for (const raw of entries) {
        if (!isValidTemplate(raw)) continue;
        const obj = raw as Record<string, unknown>;
        if (obj.body === undefined) continue;
        const langs = obj.languages;
        templates.push({
            name: obj.name as string,
            prefix: optionalString(obj.prefix),
            description: optionalString(obj.description),
            languages: Array.isArray(langs)
                ? langs.filter((l): l is string => typeof l === 'string')
                : undefined,
            body: normalizeBody(obj.body as string[] | string),
            params: parseParams(obj.params),
        });
    }
    return { ok: true, templates };
}

export function mergeTemplates(global: Template[], workspace: Template[]): Template[] {
    const byName = new Map<string, Template>();
    for (const t of global) byName.set(t.name, t);
    for (const t of workspace) byName.set(t.name, t);
    return Array.from(byName.values());
}

export function filterByLanguage(templates: Template[], languageId: string): Template[] {
    return templates.filter(t =>
        !t.languages || t.languages.length === 0 || t.languages.includes(languageId));
}
