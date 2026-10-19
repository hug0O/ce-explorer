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
    /** Where on the line the problem is (0-based columns); the whole line when absent. */
    col?: number;
    endCol?: number;
}

/** `info` is what the report calls an advice: not wrong, but worth a look. */
export const SEVERITY_LABEL: Record<ReviewSeverity, string> = { error: 'Error', warning: 'Warning', info: 'Advice' };

export const SEVERITY_ORDER: Record<ReviewSeverity, number> = { error: 0, warning: 1, info: 2 };
