declare module 'bikram-sambat' {
    export default class NepaliDate {
        constructor(date?: Date | string | number);
        format(formatStr: string): string;
        getBS(): { year: number; month: number; day: number };
        getAD(): { year: number; month: number; day: number };
        // Add other methods as needed based on the library's API
    }
}
