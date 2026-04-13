/**
 * API Response Types for Yookie Mini App
 */
export const CATEGORY_LABELS = {
    beauty_salon: 'Салон красоты',
    barber: 'Барбершоп',
    nail: 'Ногти',
    brow_lash: 'Брови и ресницы',
    spa_massage: 'Спа и массаж',
    fitness: 'Фитнес',
    yoga: 'Йога',
    tattoo: 'Татуировки',
    cosmetology: 'Косметология',
    pet_grooming: 'Груминг животных',
    dentist: 'Стоматология',
    photographer: 'Фотография',
    tutor: 'Репетиторство',
    other: 'Другое',
};
export class ApiError extends Error {
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'ApiError';
    }
}
//# sourceMappingURL=types.js.map