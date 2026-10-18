import { MemberKind } from '../models/types';
import type { MemberFormResult, MemberSpec, FieldSpec, PropertySpec, AnyMemberSpec, ClassInfo, GeneratedCode } from '../models/types';
import type { ILanguageProvider } from '../providers/ILanguageProvider';

/**
 * Single source of truth for turning a spec into GeneratedCode, dispatched by
 * member kind. Used by add/edit/preview so they cannot drift apart.
 */
export function generateFromSpec(
    provider: ILanguageProvider,
    cls: ClassInfo,
    spec: AnyMemberSpec,
    existingBody?: string
): GeneratedCode {
    if (spec.kind === MemberKind.Field) {
        return provider.generateField(cls.name, spec as FieldSpec, cls);
    }
    if (spec.kind === MemberKind.Property) {
        return provider.generateProperty(cls.name, spec as PropertySpec, cls);
    }
    return provider.generateMethod(cls.name, spec as MemberSpec, cls, existingBody);
}

export function memberFormToSpec(r: MemberFormResult): AnyMemberSpec {
    if (r.kind === MemberKind.Field) {
        const spec: FieldSpec = {
            kind: MemberKind.Field,
            name: r.name,
            type: r.type || r.returnType || 'int',
            visibility: r.visibility,
        };
        return spec;
    }
    if (r.kind === MemberKind.Property) {
        const spec: PropertySpec = {
            kind: MemberKind.Property,
            name: r.name,
            type: r.type || r.returnType || 'string',
            visibility: r.visibility,
            hasGetter: r.hasGetter,
            hasSetter: r.hasSetter,
            getterName: r.getterName,
            setterName: r.setterName,
            createBackingField: r.createBackingField,
            isDefault: false,
            isReadOnly: false,
        };
        return spec;
    }
    const spec: MemberSpec = {
        kind: r.kind,
        name: r.name,
        returnType: r.returnType || undefined,
        visibility: r.visibility,
        parameters: r.parameters || [],
        modifiers: [],
        isStatic: r.isStatic,
        isVirtual: r.isVirtual,
        isAbstract: r.isAbstract,
        isOverride: r.isOverride,
        isFinal: false,
    };
    return spec;
}
