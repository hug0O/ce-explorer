/** What a code review reports. Pure types, shared by the review rules, the report in the sidebar and the diagnostics. */

export type ReviewSeverity = 'info' | 'warning' | 'error';

export interface ReviewFinding {
    severity: ReviewSeverity;
    category: string;
    message: string;
    file: string;
    /** 0-based line. */
    line: number;
    className?: string;
    memberName?: string;
    /** How to put it right, in a sentence: shown under the message. */
    hint?: string;
    /** The code the compiler or the linter gives this problem (`H2164`, `CS0168`, `TS6133`, `no-var`…), when it has one. */
    code?: string;
    /** Who reported it, for what comes from a language server (`ts`, `Pylance`…); absent for the rules of the extension. */
    source?: string;
    /** Where on the line the problem is (0-based columns); the whole line when absent. */
    col?: number;
    endCol?: number;
}

/** `info` is what the report calls an advice: not wrong, but worth a look. */
export const SEVERITY_LABEL: Record<ReviewSeverity, string> = { error: 'Error', warning: 'Warning', info: 'Advice' };

export const SEVERITY_ORDER: Record<ReviewSeverity, number> = { error: 0, warning: 1, info: 2 };

/** A member of a class as the structure rules see it: plain data, whatever the language provider that parsed it. */
export interface ReviewMemberInfo {
    name: string;
    kind: 'field' | 'method' | 'property' | 'constructor' | 'destructor';
    visibility: string;
    isVirtual: boolean;
    isAbstract: boolean;
    isOverride: boolean;
    modifiers: string[];
    returnType?: string;
    params: string[];
    /** Declaration, 0-based inclusive lines. */
    startLine: number;
    endLine: number;
    /** Where the body is when it is not the declaration (Pascal, C++). */
    implStart?: number;
    implEnd?: number;
}

export interface ReviewClassInfo {
    name: string;
    parentClass?: string;
    isInterface: boolean;
    isRecord: boolean;
    startLine: number;
    endLine: number;
    members: ReviewMemberInfo[];
}
