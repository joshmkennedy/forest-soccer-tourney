import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

import { MatchStage } from "@/generated/prisma/enums";

export type ScrapedTournament = {
  name: string;
  season: string;
  division?: string;
  sourceUrl: string;
  groups: ScrapedGroup[];
  matches: ScrapedMatch[];
};

export type ScrapedGroup = {
  name: string;
  teams: ScrapedTeam[];
};

export type ScrapedTeam = {
  name: string;
  association: string;
  logoUrl?: string;
  stats: ScrapedStats;
};

export type ScrapedStats = {
  wins: number;
  ties: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  tieBreaker?: number;
  points: number;
};

export type ScrapedMatch = {
  home?: string;
  away?: string;
  date: Date;
  stage: MatchStage;
  field?: string;
  homeScore?: number;
  awayScore?: number;
};

export async function fetchNcFusionCupTournament(sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    headers: {
      "user-agent": "Forest 2016G Black tournament monitor",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tournament page: ${response.status}`);
  }

  const html = await response.text();

  return parseNcFusionCupTournament(html, sourceUrl);
}

export function parseNcFusionCupTournament(html: string, sourceUrl: string): ScrapedTournament {
  const $ = cheerio.load(html);
  const division = parseDivision($);
  const season = parseSeason($) ?? "2026";

  return {
    name: "NC Fusion Cup",
    season,
    division,
    sourceUrl,
    groups: parseGroups($, sourceUrl),
    matches: [...parseScheduleMatches($), ...parseBracketMatches($)],
  };
}

function parseDivision($: cheerio.CheerioAPI) {
  const heading = $("#ctl00_ContentPlaceHolder1_divSchedule h3").first().text();
  const lines = textLines(heading);

  return lines
    .find((line) => line.includes("Division"))
    ?.replace(/\s+(Schedule|Standings|Bracket)$/i, "");
}

function parseSeason($: cheerio.CheerioAPI) {
  const yearText = $("a[href*='year='], option, #divGames").text().match(/\b20\d{2}\b/);

  return yearText?.[0];
}

function parseGroups($: cheerio.CheerioAPI, sourceUrl: string): ScrapedGroup[] {
  const groups: ScrapedGroup[] = [];
  let currentGroup: ScrapedGroup | undefined;

  $("#divStds")
    .children()
    .each((_, element) => {
      const row = $(element);
      const groupName = cleanText(row.find("h3 a").first().text());

      if (groupName) {
        currentGroup = { name: groupName, teams: [] };
        groups.push(currentGroup);
        return;
      }

      if (!currentGroup || !row.hasClass("form-row")) {
        return;
      }

      const teamLink = row.find(".pt4 a").first();
      const teamName = cleanText(teamLink.text());

      if (!teamName) {
        return;
      }

      currentGroup.teams.push({
        name: teamName,
        association: cleanText(row.find(".pt4 span").first().text()) || "Unknown",
        logoUrl: resolveUrl(row.find("img.std-logo").first().attr("src"), sourceUrl),
        stats: parseStats($, row),
      });
    });

  return groups;
}

function parseStats($: cheerio.CheerioAPI, row: cheerio.Cheerio<AnyNode>): ScrapedStats {
  const values = row
    .find(".col.bigpad")
    .toArray()
    .map((cell) => cleanText($(cell).text()));

  return {
    wins: toNumber(values[1]),
    losses: toNumber(values[2]),
    ties: toNumber(values[3]),
    goalsFor: toNumber(values[4]),
    goalsAgainst: toNumber(values[5]),
    goalDifference: toNumber(values[6]),
    points: toNumber(values[8]),
    tieBreaker: toOptionalNumber(values[9]),
  };
}

function parseScheduleMatches($: cheerio.CheerioAPI): ScrapedMatch[] {
  const matches: ScrapedMatch[] = [];

  $("#divGames > .game-row").each((_, element) => {
    const row = $(element);
    const dateCells = row
      .find(".col-md-3.d-cell span")
      .toArray()
      .map((cell) => cleanText($(cell).text()));
    const dateText = dateCells.find((value) => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value));
    const timeText = dateCells.find((value) => /\d{1,2}:\d{2}\s?[AP]M/i.test(value));

    if (!dateText || !timeText) {
      return;
    }

    const scores = parseScoreText(cleanText(row.find(".col-md-5 .col-3").first().text()));

    matches.push({
        home: cleanText(row.find(".hometeam a").last().text()),
        away: cleanText(row.find(".awayteam a").last().text()),
        date: parseEasternDateTime(dateText, timeText),
        stage: MatchStage.Group,
        field: cleanText(row.find(".col-md-4 a").last().text()) || undefined,
        homeScore: scores?.homeScore,
        awayScore: scores?.awayScore,
    });
  });

  return matches;
}

function parseBracketMatches($: cheerio.CheerioAPI): ScrapedMatch[] {
  const matches: ScrapedMatch[] = [];

  $(".bracket").each((_, table) => {
    const heading = cleanText($(table).find("tr").first().text());
    const stage = heading.includes("Consolation") ? MatchStage.Consolation : MatchStage.Semifinal;

    if (!stage) {
      return;
    }

    $(table)
      .find("td[style*='color:#015CAB']")
      .each((__, cell) => {
        const cellText = cleanText($(cell).text());
        const dateMatch = cellText.match(
          /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2}\s?[AP]M)/i
        );
        const fieldMatch = cellText.match(/#\d+\s*-\s*(.+)$/);

        if (!dateMatch) {
          return;
        }

        const dateText = dateMatch[1];
        const timeText = dateMatch[2];
        const field = fieldMatch?.[1];

        matches.push({
          date: parseEasternDateTime(dateText, timeText),
          stage: cellText.includes("#4") ? MatchStage.Final : stage,
          field,
        });
      });
  });

  return matches;
}

function parseScoreText(text: string) {
  const match = text.match(/(\d+)\s*[-:]\s*(\d+)/);

  if (!match) {
    return undefined;
  }

  return {
    homeScore: Number(match[1]),
    awayScore: Number(match[2]),
  };
}

function parseEasternDateTime(dateText: string, timeText: string) {
  const [month, day, year] = dateText.split("/").map(Number);
  const timeMatch = timeText.match(/^(\d{1,2}):(\d{2})\s?([AP]M)$/i);

  if (!month || !day || !year || !timeMatch) {
    throw new Error(`Could not parse date/time: ${dateText} ${timeText}`);
  }

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const meridiem = timeMatch[3].toUpperCase();

  if (meridiem === "PM" && hours !== 12) {
    hours += 12;
  }

  if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  return new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(
      hours
    ).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00-04:00`
  );
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

function resolveUrl(value: string | undefined, sourceUrl: string) {
  if (!value) {
    return undefined;
  }

  return new URL(value, sourceUrl).toString();
}

function textLines(value: string) {
  return value
    .split(/\n|\r/)
    .map(cleanText)
    .filter(Boolean);
}

function toNumber(value: string | undefined) {
  return Number(value || 0);
}

function toOptionalNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const number = Number(value);

  return Number.isNaN(number) ? undefined : number;
}
