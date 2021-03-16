import config from "../config";
import i18n from ".";
import i18n_languages from "./languages.json";

describe("I18N Tests", () => {

    it("Checks i18n data exists for the default language", async () => {

        const i18n_data = i18n.get_lang_data(config.i18n.default_language);

        expect(Object.keys(i18n_data).length === 0).toBe(false);

    });

    it("Returns an error for a non existent language", async () => {

        expect(i18n.language_exists("xx")).toBe(false);

    });

    it("Checks is i18n data has all languages", async () => {

        for (let i = 0; i < i18n_languages.length; i++) {

            const languages_data = i18n_languages[i];

            const lang_code = languages_data[2] as string;

            expect(i18n.language_exists(lang_code)).toBe(true);

        }

    });

    it("Checks a label in all languages", async () => {

        expect(await i18n.label("en", "YES")).toMatch("Yes");
        expect(await i18n.label("es", "YES")).toMatch("Si");
        expect(await i18n.label("zh", "YES")).toMatch("是的");
        expect(await i18n.label("pt", "YES")).toMatch("Sim");
        expect(await i18n.label("fr", "YES")).toMatch("Oui");
        expect(await i18n.label("de", "YES")).toMatch("Ja");
        expect(await i18n.label("it", "YES")).toMatch("Sì");
        expect(await i18n.label("ko", "YES")).toMatch("네");
        expect(await i18n.label("ja", "YES")).toMatch("あり");
        expect(await i18n.label("he", "YES")).toMatch("כן");
        expect(await i18n.label("ru", "YES")).toMatch("Да");

    });

    it("Returns timestamp formated to date", async () => {

        const timestamp = 1612025044000;

        const date = i18n.format.dates.ts2date({timestamp});

        expect(date).toMatch("Saturday, January 30 2021, 13:44:04");

    });

    it("Checks Full ICU is on the server", async () => {

        const january = new Date(9e8);
        const spanish = new Intl.DateTimeFormat("es", { month: "long" });

        expect(spanish.format(january)).toMatch("enero");

    });

});
