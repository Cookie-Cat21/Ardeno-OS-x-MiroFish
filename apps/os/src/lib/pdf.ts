import jsPDF from 'jspdf';
import type { Project, AgentReview, AuditLog } from '@/types';
import { riskLabel } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentLang(): 'en' | 'si' {
  return (localStorage.getItem('ardeno_lang') as 'en' | 'si') ?? 'en';
}

export const PDF_SINHALA_DICT: Record<string, string> = {
  'Project Proposal':         'ව්‍යාපෘති යෝජනාව',
  'Prepared by':              'සකස් කළේ',
  'Ardeno Studio':            'අර්ඩෙනෝ ස්ටූඩියෝ',
  'Stage':                    'අදියර',
  'Risk Level':               'අවදානම් මට්ටම',
  'Consensus Score':          'එකමතික ලකුණු',
  'Description':              'විස්තරය',
  'Key Details':              'ප්‍රධාන විස්තර',
  'Client':                   'සේවාදායකයා',
  'Budget':                   'අයවැය',
  'Scores Overview':          'ලකුණු දළ විශ්ලේෂණය',
  'Project Pipeline Progress':'ව්‍යාපෘති නල රේඛා ප්‍රගතිය',
  'Agent Reviews':            'නියෝජිත සමාලෝචන',
  'Agent':                    'නියෝජිතයා',
  'Score':                    'ලකුණ',
  'Risk':                     'අවදානම',
  'Notes':                    'සටහන්',
  'Security Scans':           'ආරක්ෂක ස්කෑන්',
  'No vulnerabilities found': 'දුර්වලතා හමු නොවීය',
  'Audit Log Summary':        'විගණන ලොග් සාරාංශය',
  'Skills Used':              'භාවිත කළ කුසලතා',
  'Committed':                'ප්‍රතිශ්‍රුතිය',
  'CONFIDENTIAL':             'රහසිගත',
  'Page':                     'පිටුව',
  'of':                       'හි',
  'Action':                   'ක්‍රියාව',
  'Time':                     'කාලය',
  'N/A':                      'නැත',
  'Low':                      'අඩු',
  'Medium':                   'මධ්‍යම',
  'High':                     'ඉහළ',
  'Critical':                 'තීරණාත්මක',
  'Vulnerability':            'දුර්වලතාව',
  'Severity':                 'බරපතලකම',
};

export function translateForPDF(text: string, lang: 'en' | 'si'): string {
  if (lang === 'en') return text;
  return PDF_SINHALA_DICT[text] ?? text;
}

// ─── Color palette ─────────────────────────────────────────────────────────

type RGB = [number, number, number];
const C = {
  bg:      [11,  14,  23]  as RGB,
  surface: [15,  19,  32]  as RGB,
  gold:    [212, 175, 55]  as RGB,
  teal:    [0,   168, 150] as RGB,
  text:    [248, 249, 250] as RGB,
  muted:   [136, 146, 164] as RGB,
  border:  [30,  37,  56]  as RGB,
  danger:  [239, 68,  68]  as RGB,
  warning: [245, 158, 11]  as RGB,
  success: [16,  185, 129] as RGB,
};

// ─── Page setup helpers ────────────────────────────────────────────────────

const PAGE_W   = 210;
const PAGE_H   = 297;
const MARGIN   = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

function bgPage(pdf: jsPDF) {
  pdf.setFillColor(...C.bg);
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
  pdf.setFillColor(...C.gold);
  pdf.rect(0, 0, 2.5, PAGE_H, 'F');
}

function newPage(pdf: jsPDF) {
  pdf.addPage();
  bgPage(pdf);
}

function sectionHeader(pdf: jsPDF, title: string, y: number, lang: 'en' | 'si'): number {
  pdf.setFillColor(...C.surface);
  pdf.rect(MARGIN, y, CONTENT_W, 8, 'F');
  pdf.setDrawColor(...C.border);
  pdf.rect(MARGIN, y, CONTENT_W, 8, 'D');
  pdf.setTextColor(...C.gold);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(translateForPDF(title, lang).toUpperCase(), MARGIN + 3, y + 5.5);
  return y + 11;
}

function checkPageBreak(pdf: jsPDF, y: number, needed = 20): number {
  if (y + needed > PAGE_H - 14) {
    newPage(pdf);
    return 20;
  }
  return y;
}

function pageFooter(pdf: jsPDF, pageNum: number, lang: 'en' | 'si') {
  pdf.setTextColor(...C.muted);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${translateForPDF('Prepared by', lang)} Ardeno Studio — ${new Date().getFullYear()}`, MARGIN, PAGE_H - 8);
  pdf.text(`${translateForPDF('Page', lang)} ${pageNum}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
}

// ─── Simple proposal export ────────────────────────────────────────────────

export function exportProjectPDF(project: Project) {
  const lang = getCurrentLang();
  const pdf  = new jsPDF({ unit: 'mm', format: 'a4' });
  const t    = (s: string) => translateForPDF(s, lang);

  // ── Cover page ──────────────────────────────────────────────────────────
  bgPage(pdf);
  pdf.setFillColor(...C.gold);
  pdf.rect(0, 0, PAGE_W, 3, 'F');
  pdf.rect(0, PAGE_H - 3, PAGE_W, 3, 'F');

  pdf.setTextColor(...C.muted);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(t('CONFIDENTIAL'), PAGE_W / 2, 12, { align: 'center' });

  pdf.setTextColor(...C.gold);
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.text(t('Project Proposal'), PAGE_W / 2, 90, { align: 'center' });

  pdf.setTextColor(...C.text);
  pdf.setFontSize(14);
  pdf.text(project.title, PAGE_W / 2, 105, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setTextColor(...C.muted);
  pdf.text(`${t('Client')}: ${project.client_name ?? t('N/A')}`, PAGE_W / 2, 118, { align: 'center' });
  pdf.text(`${t('Stage')}: ${project.stage}`,                    PAGE_W / 2, 124, { align: 'center' });
  pdf.text(`${t('Prepared by')}: ${t('Ardeno Studio')}`,         PAGE_W / 2, 130, { align: 'center' });
  pdf.text(new Date().toLocaleDateString(),                       PAGE_W / 2, 136, { align: 'center' });

  // Stage progress bar
  const stages  = ['Intake','Quote','Design','Build','Security','Deploy','Done'];
  const stageIdx = stages.indexOf(project.stage);
  const segW     = CONTENT_W / stages.length;
  pdf.setTextColor(...C.muted);
  pdf.setFontSize(7);
  pdf.text(t('Project Pipeline Progress'), MARGIN, 157);

  stages.forEach((s, i) => {
    const x    = MARGIN + i * segW;
    const done = i <= stageIdx;
    pdf.setFillColor(...(done ? C.gold : C.surface));
    pdf.rect(x, 160, segW - 0.5, 6, 'F');
    pdf.setTextColor(...(done ? C.bg : C.muted));
    pdf.setFontSize(5.5);
    pdf.text(s, x + segW / 2, 164.2, { align: 'center' });
  });

  pageFooter(pdf, 1, lang);

  // ── Details page ────────────────────────────────────────────────────────
  newPage(pdf);
  let y = 18;

  y = sectionHeader(pdf, 'Key Details', y, lang);
  const details: [string, string][] = [
    [t('Client'),           project.client_name ?? t('N/A')],
    [t('Stage'),            project.stage],
    [t('Budget'),           project.budget != null ? `$${project.budget.toLocaleString()}` : t('N/A')],
    [t('Risk Level'),       riskLabel(project.risk_score ?? 0).label],
    [t('Consensus Score'),  `${project.consensus_score ?? 0}%`],
  ];

  details.forEach(([k, v]) => {
    pdf.setFillColor(...C.surface);
    pdf.rect(MARGIN, y, CONTENT_W, 7, 'F');
    pdf.setTextColor(...C.muted);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(k,  MARGIN + 3,  y + 5);
    pdf.setTextColor(...C.text);
    pdf.text(v,  MARGIN + 55, y + 5);
    y += 8;
  });

  if (project.description) {
    y += 4;
    y = sectionHeader(pdf, 'Description', y, lang);
    pdf.setTextColor(...C.text);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(project.description, CONTENT_W - 6);
    pdf.text(lines, MARGIN + 3, y);
    y += lines.length * 4.5 + 6;
  }

  // Score bars
  y = checkPageBreak(pdf, y, 30);
  y += 4;
  y = sectionHeader(pdf, 'Scores Overview', y, lang);
  const scoreRows: [string, number, RGB][] = [
    [t('Consensus Score'), project.consensus_score ?? 0, C.gold],
    [t('Risk Score'),      project.risk_score ?? 0,      C.danger],
  ];
  scoreRows.forEach(([label, val, col]) => {
    const barFull = CONTENT_W - 62;
    const filled  = (val / 100) * barFull;
    pdf.setTextColor(...C.muted);
    pdf.setFontSize(7.5);
    pdf.text(label, MARGIN + 3, y + 4.5);
    pdf.setFillColor(...C.surface);
    pdf.rect(MARGIN + 52, y, barFull, 5, 'F');
    pdf.setFillColor(...col);
    pdf.rect(MARGIN + 52, y, filled, 5, 'F');
    pdf.setTextColor(...C.text);
    pdf.text(`${val}%`, MARGIN + 52 + barFull + 3, y + 4.5);
    y += 9;
  });

  pageFooter(pdf, 2, lang);
  pdf.save(`${project.title.replace(/\s+/g, '_')}_proposal.pdf`);
}

// ─── Full report data shape ────────────────────────────────────────────────

export interface FullReportData {
  project:   Project;
  reviews:   AgentReview[];
  scans:     Array<{
    id: string;
    scan_timestamp: string;
    vulns_found:    number;
    risk_delta:     number;
    details:        Array<{ name: string; severity: string }>;
  }>;
  auditLogs: AuditLog[];
  skills:    Array<{ name: string; category: string; usage_count: number; success_rate: number }>;
  commits:   Array<{ sha: string; message: string; committed_at: string }>;
}

// ─── Full report export ────────────────────────────────────────────────────

export function exportFullReportPDF(data: FullReportData) {
  const { project, reviews, scans, auditLogs, skills, commits } = data;
  const lang    = getCurrentLang();
  const pdf     = new jsPDF({ unit: 'mm', format: 'a4' });
  const t       = (s: string) => translateForPDF(s, lang);
  let   pageNum = 1;

  const footer = () => pageFooter(pdf, pageNum, lang);
  const next   = (): number => { footer(); newPage(pdf); pageNum++; return 18; };

  // ── Cover ─────────────────────────────────────────────────────────────
  bgPage(pdf);
  pdf.setFillColor(...C.gold);
  pdf.rect(0, 0, PAGE_W, 3, 'F');
  pdf.rect(0, PAGE_H - 3, PAGE_W, 3, 'F');

  pdf.setTextColor(...C.muted);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${t('CONFIDENTIAL')} — FULL PROJECT REPORT`, PAGE_W / 2, 14, { align: 'center' });

  pdf.setTextColor(...C.gold);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ARDENO OS', PAGE_W / 2, 78, { align: 'center' });

  pdf.setFontSize(22);
  pdf.text(t('Project Proposal'), PAGE_W / 2, 90, { align: 'center' });

  pdf.setFontSize(14);
  pdf.setTextColor(...C.text);
  pdf.text(project.title, PAGE_W / 2, 104, { align: 'center' });

  const coverMeta = [
    `${t('Client')}: ${project.client_name ?? t('N/A')}`,
    `${t('Stage')}: ${project.stage}`,
    `${t('Risk Level')}: ${riskLabel(project.risk_score ?? 0).label}`,
    `${t('Consensus Score')}: ${project.consensus_score ?? 0}%`,
    new Date().toLocaleString(),
  ];
  pdf.setFontSize(8);
  pdf.setTextColor(...C.muted);
  pdf.setFont('helvetica', 'normal');
  coverMeta.forEach((line, i) => pdf.text(line, PAGE_W / 2, 116 + i * 7, { align: 'center' }));

  // Stage bar on cover
  const stages   = ['Intake','Quote','Design','Build','Security','Deploy','Done'];
  const stageIdx = stages.indexOf(project.stage);
  const segW     = CONTENT_W / stages.length;
  pdf.setTextColor(...C.muted);
  pdf.setFontSize(7);
  pdf.text(t('Project Pipeline Progress'), MARGIN, 163);
  stages.forEach((s, i) => {
    const bx   = MARGIN + i * segW;
    const done = i <= stageIdx;
    pdf.setFillColor(...(done ? C.gold : C.surface));
    pdf.rect(bx, 166, segW - 0.5, 6, 'F');
    pdf.setTextColor(...(done ? C.bg : C.muted));
    pdf.setFontSize(5.5);
    pdf.text(s, bx + segW / 2, 170.2, { align: 'center' });
  });

  footer();

  // ── TOC ───────────────────────────────────────────────────────────────
  let y = next();
  pdf.setTextColor(...C.gold);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Table of Contents', MARGIN, y);
  y += 10;

  const toc = [
    '1. Project Details',
    '2. Agent Reviews',
    '3. Security Scans',
    '4. Skills Used',
    '5. Git Commits',
    '6. Audit Log Summary',
  ];
  toc.forEach((section, i) => {
    pdf.setTextColor(...C.text);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(section, MARGIN + 5, y);
    pdf.setTextColor(...C.muted);
    pdf.text(`${i + 3}`, PAGE_W - MARGIN - 5, y, { align: 'right' });
    y += 9;
  });

  // ── Section 1: Project Details ────────────────────────────────────────
  y = next();
  y = sectionHeader(pdf, 'Key Details', y, lang);

  const detailRows: [string, string][] = [
    [t('Client'),          project.client_name ?? t('N/A')],
    [t('Stage'),           project.stage],
    [t('Budget'),          project.budget != null ? `$${project.budget.toLocaleString()}` : t('N/A')],
    [t('Risk Level'),      riskLabel(project.risk_score ?? 0).label],
    [t('Consensus Score'), `${project.consensus_score ?? 0}%`],
  ];
  detailRows.forEach(([k, v]) => {
    pdf.setFillColor(...C.surface);
    pdf.rect(MARGIN, y, CONTENT_W, 7, 'F');
    pdf.setTextColor(...C.muted);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(k, MARGIN + 3, y + 5);
    pdf.setTextColor(...C.text);
    pdf.text(v, MARGIN + 55, y + 5);
    y += 8;
  });

  if (project.description) {
    y = checkPageBreak(pdf, y + 4, 30);
    y = sectionHeader(pdf, 'Description', y, lang);
    pdf.setTextColor(...C.text);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(project.description, CONTENT_W - 6);
    pdf.text(lines, MARGIN + 3, y);
    y += lines.length * 4.5;
  }

  y = checkPageBreak(pdf, y + 4, 25);
  y = sectionHeader(pdf, 'Scores Overview', y, lang);
  const sRows: [string, number, RGB][] = [
    [t('Consensus Score'), project.consensus_score ?? 0, C.gold],
    [t('Risk Score'),      project.risk_score ?? 0,      C.danger],
  ];
  sRows.forEach(([label, val, col]) => {
    const bf = CONTENT_W - 62;
    const fi = (val / 100) * bf;
    pdf.setTextColor(...C.muted);
    pdf.setFontSize(7.5);
    pdf.text(label, MARGIN + 3, y + 4.5);
    pdf.setFillColor(...C.surface);
    pdf.rect(MARGIN + 52, y, bf, 5, 'F');
    pdf.setFillColor(...col);
    pdf.rect(MARGIN + 52, y, fi, 5, 'F');
    pdf.setTextColor(...C.text);
    pdf.text(`${val}%`, MARGIN + 52 + bf + 3, y + 4.5);
    y += 9;
  });

  // ── Section 2: Agent Reviews ──────────────────────────────────────────
  y = next();
  y = sectionHeader(pdf, 'Agent Reviews', y, lang);

  if (reviews.length === 0) {
    pdf.setTextColor(...C.muted);
    pdf.setFontSize(8);
    pdf.text('No agent reviews recorded.', MARGIN + 3, y + 5);
    y += 12;
  } else {
    const COLS = [44, 22, 22, 94];
    const HDRS = [t('Agent'), t('Score'), t('Risk'), t('Notes')];
    pdf.setFillColor(...C.border);
    pdf.rect(MARGIN, y, CONTENT_W, 7, 'F');
    let hx = MARGIN;
    HDRS.forEach((h, i) => {
      pdf.setTextColor(...C.gold);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text(h, hx + 2, y + 5);
      hx += COLS[i];
    });
    y += 8;

    reviews.slice(0, 15).forEach((r, ri) => {
      y = checkPageBreak(pdf, y, 8);
      pdf.setFillColor(...(ri % 2 === 0 ? C.surface : C.bg));
      pdf.rect(MARGIN, y, CONTENT_W, 7, 'F');
      const rs   = r.risk_score ?? 0;
      const rCol: RGB = rs > 70 ? C.danger : rs > 40 ? C.warning : C.success;
      let rx = MARGIN;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.text);  pdf.setFontSize(7.5);
      pdf.text(r.agent_name ?? '', rx + 2, y + 5); rx += COLS[0];
      pdf.setTextColor(...C.gold);
      pdf.text(`${r.consensus_score ?? 0}%`, rx + 2, y + 5); rx += COLS[1];
      pdf.setTextColor(...rCol);
      pdf.text(`${rs}%`, rx + 2, y + 5); rx += COLS[2];
      pdf.setTextColor(...C.muted);
      const noteLines = pdf.splitTextToSize(r.notes ?? '', COLS[3] - 4);
      pdf.text(noteLines[0] ?? '', rx + 2, y + 5);
      y += 8;
    });
  }

  // ── Section 3: Security Scans ─────────────────────────────────────────
  y = next();
  y = sectionHeader(pdf, 'Security Scans', y, lang);

  if (scans.length === 0) {
    pdf.setTextColor(...C.muted);
    pdf.setFontSize(8);
    pdf.text(t('No vulnerabilities found'), MARGIN + 3, y + 5);
    y += 12;
  } else {
    scans.slice(0, 6).forEach((scan, si) => {
      y = checkPageBreak(pdf, y, 22);
      const scanDate = new Date(scan.scan_timestamp).toLocaleString();
      pdf.setFillColor(...C.surface);
      pdf.rect(MARGIN, y, CONTENT_W, 7, 'F');
      pdf.setTextColor(...C.muted);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Scan ${si + 1} — ${scanDate}`, MARGIN + 3, y + 5);
      pdf.setTextColor(...(scan.vulns_found > 0 ? C.danger : C.success));
      pdf.text(`${scan.vulns_found} vuln(s)  Δrisk: +${scan.risk_delta}`, PAGE_W - MARGIN - 3, y + 5, { align: 'right' });
      y += 8;

      scan.details?.slice(0, 5).forEach(d => {
        y = checkPageBreak(pdf, y, 7);
        const sevCol: RGB = d.severity === 'critical' ? C.danger : d.severity === 'high' ? C.warning : C.teal;
        pdf.setFillColor(...sevCol);
        pdf.rect(MARGIN + 3, y + 1.5, 2, 4, 'F');
        pdf.setTextColor(...C.text);
        pdf.setFontSize(7.5);
        pdf.text(d.name, MARGIN + 8, y + 5);
        pdf.setTextColor(...sevCol);
        pdf.text(d.severity, PAGE_W - MARGIN - 3, y + 5, { align: 'right' });
        y += 7;
      });
      y += 3;
    });
  }

  // ── Section 4: Skills Used ────────────────────────────────────────────
  y = next();
  y = sectionHeader(pdf, 'Skills Used', y, lang);

  if (skills.length === 0) {
    pdf.setTextColor(...C.muted);
    pdf.setFontSize(8);
    pdf.text('No skills linked to this project.', MARGIN + 3, y + 5);
    y += 12;
  } else {
    const SC = [60, 36, 30, 56];
    const SH = ['Skill', 'Category', 'Usage', 'Success Rate'];
    pdf.setFillColor(...C.border);
    pdf.rect(MARGIN, y, CONTENT_W, 7, 'F');
    let shx = MARGIN;
    SH.forEach((h, i) => {
      pdf.setTextColor(...C.gold);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text(h, shx + 2, y + 5);
      shx += SC[i];
    });
    y += 8;

    skills.slice(0, 12).forEach((sk, si) => {
      y = checkPageBreak(pdf, y, 7);
      pdf.setFillColor(...(si % 2 === 0 ? C.surface : C.bg));
      pdf.rect(MARGIN, y, CONTENT_W, 7, 'F');
      let skx = MARGIN;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.text);   pdf.setFontSize(7.5);
      pdf.text(sk.name,              skx + 2, y + 5); skx += SC[0];
      pdf.setTextColor(...C.muted);
      pdf.text(sk.category,          skx + 2, y + 5); skx += SC[1];
      pdf.text(`${sk.usage_count}×`, skx + 2, y + 5); skx += SC[2];
      pdf.setTextColor(...(sk.success_rate >= 80 ? C.success : C.warning));
      pdf.text(`${sk.success_rate}%`, skx + 2, y + 5);
      y += 8;
    });
  }

  // ── Section 5: Git Commits ────────────────────────────────────────────
  y = next();
  y = sectionHeader(pdf, 'Git Commits', y, lang);

  if (commits.length === 0) {
    pdf.setTextColor(...C.muted);
    pdf.setFontSize(8);
    pdf.text('No commits recorded.', MARGIN + 3, y + 5);
    y += 12;
  } else {
    commits.slice(0, 10).forEach((c, ci) => {
      y = checkPageBreak(pdf, y, 9);
      pdf.setFillColor(...(ci % 2 === 0 ? C.surface : C.bg));
      pdf.rect(MARGIN, y, CONTENT_W, 9, 'F');
      pdf.setTextColor(...C.teal);
      pdf.setFontSize(7);
      pdf.setFont('courier', 'normal');
      pdf.text(c.sha.slice(0, 10), MARGIN + 2, y + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...C.text);
      pdf.setFontSize(7.5);
      const msg = pdf.splitTextToSize(c.message, CONTENT_W - 56);
      pdf.text(msg[0] ?? '', MARGIN + 22, y + 6);
      pdf.setTextColor(...C.muted);
      pdf.setFontSize(6.5);
      pdf.text(new Date(c.committed_at).toLocaleDateString(), PAGE_W - MARGIN - 2, y + 6, { align: 'right' });
      y += 10;
    });
  }

  // ── Section 6: Audit Log ──────────────────────────────────────────────
  y = next();
  y = sectionHeader(pdf, 'Audit Log Summary', y, lang);

  if (auditLogs.length === 0) {
    pdf.setTextColor(...C.muted);
    pdf.setFontSize(8);
    pdf.text('No audit entries.', MARGIN + 3, y + 5);
  } else {
    auditLogs.slice(0, 12).forEach((log, li) => {
      y = checkPageBreak(pdf, y, 8);
      pdf.setFillColor(...(li % 2 === 0 ? C.surface : C.bg));
      pdf.rect(MARGIN, y, CONTENT_W, 8, 'F');
      pdf.setTextColor(...C.muted);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(log.created_at).toLocaleString(), MARGIN + 2, y + 5.5);
      pdf.setTextColor(...C.text);
      pdf.setFontSize(7.5);
      pdf.text(String(log.action ?? '').replace(/_/g, ' '), MARGIN + 44, y + 5.5);
      if ((log as any).rolled_back) {
        pdf.setTextColor(...C.warning);
        pdf.text('↩ rolled back', PAGE_W - MARGIN - 3, y + 5.5, { align: 'right' });
      }
      y += 9;
    });
  }

  footer();
  pdf.save(`${project.title.replace(/\s+/g, '_')}_full_report.pdf`);
}
