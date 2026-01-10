import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";
import { KundaliChart } from "./KundaliChart";

const styles = StyleSheet.create({
  page: { padding: 20 },
  title: { fontSize: 18, marginBottom: 10 },
  table: { fontSize: 10 }
});

export const KundaliPDF = ({ kundali }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>PanditYatra Kundali</Text>
      <Text>DOB: {kundali.dob}</Text>
      <Text>Time: {kundali.time}</Text>

      <View style={{ marginVertical: 10 }}>
        <KundaliChart planets={kundali.planets} />
      </View>

      {kundali.planets.map((p: any) => (
        <Text key={p.planet}>
          {p.planet} – House {p.house} – {p.nakshatra}
        </Text>
      ))}
    </Page>
  </Document>
);