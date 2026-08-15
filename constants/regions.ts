import type { GuineaRegion } from "@/types";

export const GUINEA_REGIONS: GuineaRegion[] = [
  {
    name: "Conakry",
    code: "C",
    prefectures: ["Dixinn", "Kaloum", "Matam", "Matoto", "Ratoma"],
  },
  {
    name: "Boké",
    code: "B",
    prefectures: ["Boké", "Boffa", "Fria", "Gaoual", "Koundara"],
  },
  {
    name: "Kindia",
    code: "D",
    prefectures: ["Kindia", "Coyah", "Dubréka", "Forécariah", "Télimélé"],
  },
  {
    name: "Labé",
    code: "L",
    prefectures: ["Labé", "Koubia", "Lélouma", "Mali", "Tougué"],
  },
  {
    name: "Mamou",
    code: "M",
    prefectures: ["Mamou", "Dalaba", "Pita"],
  },
  {
    name: "Faranah",
    code: "F",
    prefectures: ["Faranah", "Dabola", "Dinguiraye", "Kissidougou"],
  },
  {
    name: "Kankan",
    code: "K",
    prefectures: ["Kankan", "Kérouané", "Kouroussa", "Mandiana", "Siguiri"],
  },
  {
    name: "N'Zérékoré",
    code: "N",
    prefectures: [
      "N'Zérékoré",
      "Beyla",
      "Guéckédou",
      "Lola",
      "Macenta",
      "Yomou",
    ],
  },
];

export const ALL_CITIES = GUINEA_REGIONS.flatMap((r) => [
  r.name,
  ...r.prefectures,
]).sort();
