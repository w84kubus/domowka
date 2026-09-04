/**
 * Adres kanoniczny serwisu.
 *
 * Świadomie z „www": apex `doplay.pl` odpowiada przekierowaniem 308 na
 * `www.doplay.pl`, więc to ta druga forma realnie serwuje treść. Canonical
 * wskazujący na adres, który tylko przekierowuje, każe wyszukiwarce robić
 * dodatkowy skok i rozmywa sygnały między dwoma adresami.
 */
export const SITE_URL = "https://www.doplay.pl";
