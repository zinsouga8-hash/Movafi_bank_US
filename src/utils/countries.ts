export interface CountryInfo {
  code: string;
  nameEn: string;
  nameFr: string;
  nameEs: string;
  nameAr: string;
  flag: string;
  dialCode: string;
  cities: string[];
}

export const COUNTRIES: CountryInfo[] = [
  {
    code: 'US',
    nameEn: 'United States',
    nameFr: 'États-Unis',
    nameEs: 'Estados Unidos',
    nameAr: 'الولايات المتحدة',
    flag: '🇺🇸',
    dialCode: '+1',
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'San Francisco', 'Boston', 'Seattle', 'Dallas', 'Atlanta', 'Washington D.C.']
  },
  {
    code: 'CA',
    nameEn: 'Canada',
    nameFr: 'Canada',
    nameEs: 'Canadá',
    nameAr: 'كندا',
    flag: '🇨🇦',
    dialCode: '+1',
    cities: ['Toronto', 'Montréal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton', 'Québec City']
  },
  {
    code: 'FR',
    nameEn: 'France',
    nameFr: 'France',
    nameEs: 'Francia',
    nameAr: 'فرنسا',
    flag: '🇫🇷',
    dialCode: '+33',
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux', 'Strasbourg', 'Nantes', 'Lille']
  },
  {
    code: 'GB',
    nameEn: 'United Kingdom',
    nameFr: 'Royaume-Uni',
    nameEs: 'Reino Unido',
    nameAr: 'المملكة المتحدة',
    flag: '🇬🇧',
    dialCode: '+44',
    cities: ['London', 'Manchester', 'Edinburgh', 'Birmingham', 'Glasgow', 'Bristol', 'Leeds']
  },
  {
    code: 'DE',
    nameEn: 'Germany',
    nameFr: 'Allemagne',
    nameEs: 'Alemania',
    nameAr: 'ألمانيا',
    flag: '🇩🇪',
    dialCode: '+49',
    cities: ['Frankfurt', 'Berlin', 'Munich', 'Hamburg', 'Düsseldorf', 'Stuttgart', 'Cologne']
  },
  {
    code: 'CH',
    nameEn: 'Switzerland',
    nameFr: 'Suisse',
    nameEs: 'Suiza',
    nameAr: 'سويسرا',
    flag: '🇨🇭',
    dialCode: '+41',
    cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Lugano']
  },
  {
    code: 'BH',
    nameEn: 'Bahrain',
    nameFr: 'Bahreïn',
    nameEs: 'Baréin',
    nameAr: 'البحرين',
    flag: '🇧🇭',
    dialCode: '+973',
    cities: ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'A\'ali', 'Isa Town', 'Sitra', 'Budaiya']
  },
  {
    code: 'SA',
    nameEn: 'Saudi Arabia',
    nameFr: 'Arabie Saoudite',
    nameEs: 'Arabia Saudita',
    nameAr: 'المملكة العربية السعودية',
    flag: '🇸🇦',
    dialCode: '+966',
    cities: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Dhahran', 'Tabuk']
  },
  {
    code: 'AE',
    nameEn: 'United Arab Emirates',
    nameFr: 'Émirats Arabes Unis',
    nameEs: 'Emiratos Árabes Unidos',
    nameAr: 'الإمارات العربية المتحدة',
    flag: '🇦🇪',
    dialCode: '+971',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Al Ain']
  },
  {
    code: 'QA',
    nameEn: 'Qatar',
    nameFr: 'Qatar',
    nameEs: 'Catar',
    nameAr: 'قطر',
    flag: '🇶🇦',
    dialCode: '+974',
    cities: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Lusail', 'Al Khor']
  },
  {
    code: 'KW',
    nameEn: 'Kuwait',
    nameFr: 'Koweït',
    nameEs: 'Kuwait',
    nameAr: 'الكويت',
    flag: '🇰🇼',
    dialCode: '+965',
    cities: ['Kuwait City', 'Al Ahmadi', 'Hawalli', 'Salmiya', 'Al Farwaniyah']
  },
  {
    code: 'OM',
    nameEn: 'Oman',
    nameFr: 'Oman',
    nameEs: 'Omán',
    nameAr: 'عُمان',
    flag: '🇴🇲',
    dialCode: '+968',
    cities: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur']
  },
  {
    code: 'BJ',
    nameEn: 'Benin',
    nameFr: 'Bénin',
    nameEs: 'Benín',
    nameAr: 'بنين',
    flag: '🇧🇯',
    dialCode: '+229',
    cities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Ouidah', 'Djougou', 'Bohicon', 'Kandi']
  },
  {
    code: 'SN',
    nameEn: 'Senegal',
    nameFr: 'Sénégal',
    nameEs: 'Senegal',
    nameAr: 'السنغال',
    flag: '🇸🇳',
    dialCode: '+221',
    cities: ['Dakar', 'Thiès', 'Saint-Louis', 'Touba', 'Ziguinchor', 'Mbour']
  },
  {
    code: 'CI',
    nameEn: 'Ivory Coast',
    nameFr: 'Côte d\'Ivoire',
    nameEs: 'Costa de Marfil',
    nameAr: 'ساحل العاج',
    flag: '🇨🇮',
    dialCode: '+225',
    cities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo', 'Daloa']
  },
  {
    code: 'TG',
    nameEn: 'Togo',
    nameFr: 'Togo',
    nameEs: 'Togo',
    nameAr: 'توغو',
    flag: '🇹🇬',
    dialCode: '+228',
    cities: ['Lomé', 'Sokodé', 'Kara', 'Kpalimé', 'Atakpamé']
  },
  {
    code: 'CM',
    nameEn: 'Cameroon',
    nameFr: 'Cameroun',
    nameEs: 'Camerún',
    nameAr: 'الكاميرون',
    flag: '🇨🇲',
    dialCode: '+237',
    cities: ['Douala', 'Yaoundé', 'Garoua', 'Bafoussam', 'Bamenda', 'Kribi']
  },
  {
    code: 'MA',
    nameEn: 'Morocco',
    nameFr: 'Maroc',
    nameEs: 'Marruecos',
    nameAr: 'المغرب',
    flag: '🇲🇦',
    dialCode: '+212',
    cities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir']
  },
  {
    code: 'DZ',
    nameEn: 'Algeria',
    nameFr: 'Algérie',
    nameEs: 'Argelia',
    nameAr: 'الجزائر',
    flag: '🇩🇿',
    dialCode: '+213',
    cities: ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Setif', 'Batna']
  },
  {
    code: 'TN',
    nameEn: 'Tunisia',
    nameFr: 'Tunisie',
    nameEs: 'Túnez',
    nameAr: 'تونس',
    flag: '🇹🇳',
    dialCode: '+216',
    cities: ['Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Kairouan', 'Hammamet']
  },
  {
    code: 'EG',
    nameEn: 'Egypt',
    nameFr: 'Égypte',
    nameEs: 'Egipto',
    nameAr: 'مصر',
    flag: '🇪🇬',
    dialCode: '+20',
    cities: ['Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh', 'Luxor', 'Hurghada']
  },
  {
    code: 'NG',
    nameEn: 'Nigeria',
    nameFr: 'Nigeria',
    nameEs: 'Nigeria',
    nameAr: 'نيجيريا',
    flag: '🇳🇬',
    dialCode: '+234',
    cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan']
  },
  {
    code: 'ES',
    nameEn: 'Spain',
    nameFr: 'Espagne',
    nameEs: 'España',
    nameAr: 'إسبانيا',
    flag: '🇪🇸',
    dialCode: '+34',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Malaga', 'Bilbao']
  },
  {
    code: 'IT',
    nameEn: 'Italy',
    nameFr: 'Italie',
    nameEs: 'Italia',
    nameAr: 'إيطاليا',
    flag: '🇮🇹',
    dialCode: '+39',
    cities: ['Rome', 'Milan', 'Florence', 'Venice', 'Naples', 'Turin']
  },
  {
    code: 'BE',
    nameEn: 'Belgium',
    nameFr: 'Belgique',
    nameEs: 'Bélgica',
    nameAr: 'بلجيكا',
    flag: '🇧🇪',
    dialCode: '+32',
    cities: ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Liège']
  },
  {
    code: 'LU',
    nameEn: 'Luxembourg',
    nameFr: 'Luxembourg',
    nameEs: 'Luxemburgo',
    nameAr: 'لوكسمبورغ',
    flag: '🇱🇺',
    dialCode: '+352',
    cities: ['Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange']
  },
  {
    code: 'NL',
    nameEn: 'Netherlands',
    nameFr: 'Pays-Bas',
    nameEs: 'Países Bajos',
    nameAr: 'هولندا',
    flag: '🇳🇱',
    dialCode: '+31',
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven']
  },
  {
    code: 'SG',
    nameEn: 'Singapore',
    nameFr: 'Singapour',
    nameEs: 'Singapur',
    nameAr: 'سنغافورة',
    flag: '🇸🇬',
    dialCode: '+65',
    cities: ['Singapore']
  },
  {
    code: 'JP',
    nameEn: 'Japan',
    nameFr: 'Japon',
    nameEs: 'Japón',
    nameAr: 'اليابان',
    flag: '🇯🇵',
    dialCode: '+81',
    cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Fukuoka']
  },
  {
    code: 'AU',
    nameEn: 'Australia',
    nameFr: 'Australie',
    nameEs: 'Australia',
    nameAr: 'أستراليا',
    flag: '🇦🇺',
    dialCode: '+61',
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide']
  },
  {
    code: 'ZA',
    nameEn: 'South Africa',
    nameFr: 'Afrique du Sud',
    nameEs: 'Sudáfrica',
    nameAr: 'جنوب أفريقيا',
    flag: '🇿🇦',
    dialCode: '+27',
    cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Sandton']
  },
  {
    code: 'BR',
    nameEn: 'Brazil',
    nameFr: 'Brésil',
    nameEs: 'Brasil',
    nameAr: 'البرازيل',
    flag: '🇧🇷',
    dialCode: '+55',
    cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Belo Horizonte']
  },
  {
    code: 'MX',
    nameEn: 'Mexico',
    nameFr: 'Mexique',
    nameEs: 'México',
    nameAr: 'المكسيك',
    flag: '🇲🇽',
    dialCode: '+52',
    cities: [
      'Mexico City (CDMX)',
      'Guadalajara',
      'Monterrey',
      'Puebla',
      'Tijuana',
      'León',
      'Cancún',
      'Ciudad Juárez',
      'Zapopan',
      'Mérida',
      'Querétaro',
      'Toluca',
      'Aguascalientes',
      'San Luis Potosí',
      'Hermosillo',
      'Mexicali',
      'Culiacán',
      'Acapulco',
      'Cuernavaca',
      'Veracruz',
      'Playa del Carmen'
    ]
  }
];

export function getLocalizedCountryName(country: CountryInfo, lang: string): string {
  if (lang === 'fr') return country.nameFr;
  if (lang === 'es') return country.nameEs;
  if (lang === 'ar') return country.nameAr;
  return country.nameEn;
}
