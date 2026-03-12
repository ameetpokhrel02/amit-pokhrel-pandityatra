import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

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
  };
}

export const KundaliPDF = ({ formData, result }: KundaliPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>PanditYatra</Text>
        <Text style={styles.subtitle}>
          Kundali Birth Chart Report — {result.source === 'online' ? 'High Precision (Swiss Ephemeris)' : 'Approximate (Offline)'}
        </Text>
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