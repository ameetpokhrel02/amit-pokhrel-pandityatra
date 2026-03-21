import { Page, Text, View, Document, StyleSheet, Svg, Line, Rect, Path, Tspan, G, Image } from "@react-pdf/renderer";
import logo from '@/assets/images/PanditYatralogo.png';

const orange = '#EA580C';
const darkBrown = '#3E2723';
const lightOrange = '#FFF7ED';
const borderGray = '#E5E7EB';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: darkBrown,
  },
  // Header
  headerContainer: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: orange,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: orange,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    backgroundColor: lightOrange,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  infoItem: {
    width: '50%',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: darkBrown,
  },
  // Section
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: darkBrown,
    marginBottom: 8,
    marginTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: lightOrange,
    borderBottomWidth: 1.5,
    borderBottomColor: orange,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#9A3412',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: borderGray,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: '#FFFBF5',
  },
  tableCell: {
    fontSize: 9,
  },
  col1: { width: '8%' },
  col2: { width: '22%' },
  col3: { width: '25%' },
  col4: { width: '25%' },
  col5: { width: '20%' },
  // Prediction
  predictionBox: {
    backgroundColor: lightOrange,
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 6,
    padding: 14,
    marginTop: 8,
  },
  predictionText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#4B3621',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: '#D1D5DB',
    paddingTop: 8,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#9CA3AF',
    marginBottom: 2,
  },
});

interface KundaliPDFProps {
  formData: {
    name?: string;
    gender?: string;
    year?: string;
    month?: string;
    day?: string;
    hour?: string;
    minute?: string;
    place?: string;
  };
  result: {
    planets?: Array<{
      planet: string;
      longitude: number;
      rashi: string;
      nakshatra?: string;
      house?: number;
    }>;
    ai_prediction?: string;
    source?: string;
    lagna?: number;
  };
}

const KundaliChartPDF = ({ planets = [], lagna = 1 }: { planets: any[], lagna?: number }) => {
    const shortPlanetNames: Record<string, string> = {
        "Sun": "Su", "Moon": "Mo", "Mars": "Ma", "Mercury": "Me", "Jupiter": "Ju",
        "Venus": "Ve", "Saturn": "Sa", "Rahu": "Ra", "Ketu": "Ke", "Ascendant": "As"
    };

    const planetsInHouses: Record<number, string[]> = {};
    for (let i = 1; i <= 12; i++) planetsInHouses[i] = [];
    planets.forEach(p => {
        const name = shortPlanetNames[p.planet] || p.planet.substring(0, 2);
        if (p.house >= 1 && p.house <= 12) planetsInHouses[p.house].push(name);
    });

    const getRashiForHouse = (houseNum: number) => {
        let r = (lagna + houseNum - 1) % 12;
        return r === 0 ? 12 : r;
    };

    const hPos: Record<number, any> = {
        1: { x: 150, y: 100, rX: 150, rY: 55, lX: 150, lY: 35, label: "Body" },
        2: { x: 75, y: 50, rX: 100, rY: 70, lX: 60, lY: 25, label: "Money" },
        3: { x: 40, y: 85, rX: 65, rY: 105, lX: 25, lY: 55, label: "Siblings" },
        4: { x: 105, y: 150, rX: 60, rY: 150, lX: 45, lY: 125, label: "Home" },
        5: { x: 40, y: 225, rX: 65, rY: 205, lX: 25, lY: 245, label: "Study" },
        6: { x: 75, y: 260, rX: 100, rY: 240, lX: 60, lY: 280, label: "Enemies" },
        7: { x: 150, y: 205, rX: 150, rY: 250, lX: 150, lY: 275, label: "Partner" },
        8: { x: 225, y: 260, rX: 200, rY: 240, lX: 240, lY: 280, label: "Longevity" },
        9: { x: 260, y: 225, rX: 240, rY: 205, lX: 275, lY: 245, label: "Luck" },
        10: { x: 195, y: 150, rX: 240, rY: 150, lX: 255, lY: 125, label: "Work" },
        11: { x: 260, y: 85, rX: 240, rY: 105, lX: 275, lY: 55, label: "Gains" },
        12: { x: 225, y: 50, rX: 200, rY: 70, lX: 240, lY: 25, label: "Loss" },
    };

    return (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <Text style={{ fontSize: 12, marginBottom: 10, color: orange, fontFamily: 'Helvetica-Bold' }}>LAGNA CHART (D1)</Text>
            <Svg width="300" height="300" viewBox="0 0 300 300">
                <Rect x="0" y="0" width="300" height="300" fill="white" stroke={orange} strokeWidth={2} />
                <Line x1="0" y1="0" x2="300" y2="300" stroke={orange} strokeWidth={1} />
                <Line x1="0" y1="300" x2="300" y2="0" stroke={orange} strokeWidth={1} />
                <Path d="M 150 0 L 0 150 L 150 300 L 300 150 Z" stroke={orange} strokeWidth={1} fill="none" />
                
                {/* Rashis */}
                <G>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <Text key={n} x={hPos[n].rX} y={hPos[n].rY} textAnchor="middle" style={{ fontSize: 10, fill: "#9A3412" }}>{getRashiForHouse(n).toString()}</Text>
                    ))}
                </G>

                {/* House Labels */}
                <G>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <Text key={n} x={hPos[n].lX} y={hPos[n].lY} textAnchor="middle" style={{ fontSize: 6, fill: "#FB923C" }}>{hPos[n].label}</Text>
                    ))}
                </G>

                {/* Planets */}
                <G>
                    {Object.entries(planetsInHouses).map(([h, pList]) => {
                        const hNum = Number(h);
                        return (
                            <Text key={h} x={hPos[hNum].x} y={hPos[hNum].y} textAnchor="middle" style={{ fontSize: 9, fill: darkBrown, fontFamily: 'Helvetica-Bold' }}>
                                {pList.join(", ")}
                            </Text>
                        );
                    })}
                </G>
            </Svg>
        </View>
    );
};

export const KundaliPDF = ({ formData, result }: KundaliPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={[styles.headerContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View>
          <Text style={styles.title}>PanditYatra</Text>
          <Text style={styles.subtitle}>
            Kundali Birth Chart Report — {result.source === 'online' ? 'High Precision (Swiss Ephemeris)' : 'Approximate (Offline)'}
          </Text>
        </View>
        <Image src={logo} style={{ width: 60, height: 60 }} />
      </View>

      {/* Personal Info */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Full Name</Text>
          <Text style={styles.infoValue}>{formData.name || 'N/A'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Gender</Text>
          <Text style={styles.infoValue}>{(formData.gender || 'N/A').charAt(0).toUpperCase() + (formData.gender || '').slice(1)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Date of Birth</Text>
          <Text style={styles.infoValue}>{formData.year}-{formData.month}-{formData.day}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Time of Birth</Text>
          <Text style={styles.infoValue}>{formData.hour}:{formData.minute}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Place of Birth</Text>
          <Text style={styles.infoValue}>{formData.place || 'Unknown'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Generated On</Text>
          <Text style={styles.infoValue}>{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>
      </View>

      {/* Lagna Chart */}
      <KundaliChartPDF planets={result.planets || []} lagna={result.lagna || 1} />

      {/* Planetary Positions Table */}
      <Text style={styles.sectionTitle}>Planetary Positions</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.col1]}>#</Text>
        <Text style={[styles.tableHeaderText, styles.col2]}>Planet</Text>
        <Text style={[styles.tableHeaderText, styles.col3]}>Rashi (Sign)</Text>
        <Text style={[styles.tableHeaderText, styles.col4]}>Nakshatra</Text>
        <Text style={[styles.tableHeaderText, styles.col5]}>Longitude</Text>
      </View>
      {(result.planets || []).map((p, idx) => (
        <View key={p.planet} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
          <Text style={[styles.tableCell, styles.col1]}>{idx + 1}</Text>
          <Text style={[styles.tableCell, styles.col2, { fontFamily: 'Helvetica-Bold' }]}>{p.planet}</Text>
          <Text style={[styles.tableCell, styles.col3]}>{p.rashi}</Text>
          <Text style={[styles.tableCell, styles.col4]}>{p.nakshatra || '—'}</Text>
          <Text style={[styles.tableCell, styles.col5]}>{Number(p.longitude).toFixed(2)}°</Text>
        </View>
      ))}

      {/* AI Prediction */}
      <Text style={styles.sectionTitle}>AI Prediction & Analysis</Text>
      <View style={styles.predictionBox}>
        <Text style={styles.predictionText}>
          {result.ai_prediction || 'No prediction available.'}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>Thank you for using PanditYatra — Your Spiritual Journey Partner</Text>
        <Text style={styles.footerText}>This is a computer-generated report. For detailed consultations, please book a session with our verified pandits.</Text>
        <Text style={styles.footerText}>support@pandityatra.com | www.pandityatra.com</Text>
      </View>
    </Page>
  </Document>
);

export default KundaliPDF;