import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Chip, Button } from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef } from 'react';

interface ELDLogSheetProps {
  logs: any[];
}

const STATUS_COLOR: Record<string, string> = {
  'On Duty': '#f8c471',
  'Driving': '#58d68d',
  'Break': '#85c1e9',
  'Off Duty': '#d5dbdb',
  'Sleeper': '#bb8fce',
};

function getStatusRow(status: string) {
  switch (status) {
    case 'Off Duty': return 0;
    case 'Sleeper': return 1;
    case 'Driving': return 2;
    case 'On Duty': return 3;
    default: return 0;
  }
}

export default function ELDLogSheet({ logs }: ELDLogSheetProps) {
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    const element = pdfRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('eld-log-sheet.pdf');
  };

  if (!logs || logs.length === 0) return null;
  return (
    <Box>
      <Button variant="outlined" color="primary" sx={{ mb: 2 }} onClick={handleExportPDF}>
        Export Log Sheets to PDF
      </Button>
      <div ref={pdfRef}>
        {logs.map((day, idx) => (
          <Paper key={idx} sx={{ mb: 5, p: 2, borderRadius: 3 }} elevation={2}>
            <Typography variant="h6" sx={{ mb: 1 }}>Date: {day.date}</Typography>
            {/* Summary Table */}
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Miles Driven</TableCell>
                    <TableCell>Driving Hours</TableCell>
                    <TableCell>On Duty</TableCell>
                    <TableCell>Break</TableCell>
                    <TableCell>Off Duty</TableCell>
                    <TableCell>HOS Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{day.summary.miles_driven}</TableCell>
                    <TableCell>{day.summary.driving_hours}</TableCell>
                    <TableCell>{day.summary.on_duty_hours}</TableCell>
                    <TableCell>{day.summary.break_minutes} min</TableCell>
                    <TableCell>{day.summary.off_duty_hours}</TableCell>
                    <TableCell>{day.summary.hos_notes}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            {/* Log Sheet Grid */}
            <Box sx={{ overflowX: 'auto', mb: 2 }}>
              <svg width="1000" height="140" viewBox="0 0 1000 140" style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8 }}>
                {/* Draw grid */}
                {[0,1,2,3].map(row => (
                  <line key={row} x1={0} y1={30*row+30} x2={1000} y2={30*row+30} stroke="#888" strokeWidth={1} />
                ))}
                {[...Array(25)].map((_, h) => (
                  <line key={h} x1={h*40} y1={30} x2={h*40} y2={150} stroke="#bbb" strokeWidth={h%6===0?2:1} />
                ))}
                {/* Draw status bars */}
                {day.statuses.map((s: any, i: number) => {
                  const start = parseTime(s.start);
                  const end = parseTime(s.end);
                  const x1 = start * 40;
                  const x2 = end * 40;
                  const y = getStatusRow(s.status) * 30 + 30;
                  return (
                    <g key={i}>
                      <rect x={x1} y={y} width={x2-x1} height={28} fill={STATUS_COLOR[s.status] || '#eee'} opacity={0.85} />
                      <text x={x1+5} y={y+18} fontSize={12} fill="#333">{s.status}</text>
                    </g>
                  );
                })}
                {/* Status labels */}
                {['Off Duty','Sleeper','Driving','On Duty'].map((label, i) => (
                  <text key={label} x={5} y={30*(i+1)-10} fontSize={14} fill="#333">{label}</text>
                ))}
                {/* Hour labels */}
                {[...Array(25)].map((_, h) => (
                  <text key={h} x={h*40+2} y={25} fontSize={10} fill="#333">{h}</text>
                ))}
              </svg>
            </Box>
            {/* Legend and block descriptions */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Legend:</Typography>
              {Object.entries(STATUS_COLOR).map(([status, color]) => (
                <Chip key={status} label={status} sx={{ bgcolor: color, color: '#222', fontWeight: 700 }} size="small" />
              ))}
            </Box>
            <Box>
              {day.statuses.map((s: any, i: number) => (
                <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                  <b>{s.status}:</b> {s.start} - {s.end} {s.desc ? `(${s.desc})` : ''}
                </Typography>
              ))}
            </Box>
          </Paper>
        ))}
      </div>
    </Box>
  );
}

function parseTime(t: string) {
  // Accepts "HH:MM" or "HH:MM"
  const [h, m] = t.split(':').map(Number);
  return h + (m || 0)/60;
}
