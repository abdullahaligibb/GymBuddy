import { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NutritionTip } from "../types";
import { nutritionTips } from "../data/nutritionTips";
import { filterNutritionTips } from "../domain/nutritionTips";

type Props = {
  tips?: readonly NutritionTip[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
};

export function NutritionTipLibrary({ tips = nutritionTips, loading = false, error, onRetry }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Alle");
  const [expanded, setExpanded] = useState<string>();
  const categoryList = useRef<ScrollView>(null);
  const categories = useMemo(() => ["Alle", ...new Set(tips.map((tip) => tip.category))], [tips]);
  const filtered = useMemo(() => filterNutritionTips(tips, search, category), [tips, search, category]);

  return <View style={s.section}>
    <TextInput accessibilityLabel="Ernährungstipps suchen" placeholder="Titel, Inhalt oder Stichwort suchen …" placeholderTextColor="#8D9A95" value={search} onChangeText={setSearch} style={s.input} />
    <ScrollView ref={categoryList} horizontal contentContainerStyle={s.categories}>
      {categories.map((item) => <TouchableOpacity key={item} accessibilityRole="button" accessibilityLabel={`Ernährungskategorie ${item}`} accessibilityState={{selected:category===item}} onPress={()=>setCategory(item)} style={[s.chip,category===item&&s.selected]}><Text style={category===item?s.selectedText:s.body}>{item}</Text></TouchableOpacity>)}
    </ScrollView>
    {search || category!=="Alle" ? <TouchableOpacity accessibilityRole="button" onPress={()=>{setSearch("");setCategory("Alle");categoryList.current?.scrollTo({x:0,animated:false});}}><Text style={s.link}>Ernährungsfilter zurücksetzen</Text></TouchableOpacity> : null}
    {loading ? <Text accessibilityLiveRegion="polite" style={s.body}>Ernährungstipps werden geladen …</Text> : error ? <View><Text accessibilityRole="alert" style={s.error}>{error}</Text>{onRetry ? <TouchableOpacity accessibilityRole="button" onPress={onRetry}><Text style={s.link}>Ernährungstipps erneut laden</Text></TouchableOpacity>:null}</View> : <>
      <Text style={s.body}>{filtered.length} von {tips.length} Tipps</Text>
      {!filtered.length ? <Text style={s.body}>{tips.length ? "Kein Ernährungstipp gefunden. Passe die Suche oder Kategorie an." : "Noch keine Ernährungstipps vorhanden."}</Text> : null}
      {filtered.map((tip)=> <View key={tip.id} style={s.card}>
        <Text style={s.label}>{tip.category}</Text>
        <Text style={s.title}>{tip.title}</Text>
        {expanded===tip.id ? <View style={s.details}><Text style={s.body}>{tip.body}</Text><Text style={s.tags}>{tip.tags.join(" · ")}</Text></View>:null}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${tip.title}: ${expanded===tip.id?"Details schliessen":"Details anzeigen"}`} accessibilityState={{expanded:expanded===tip.id}} onPress={()=>setExpanded(expanded===tip.id?undefined:tip.id)}><Text style={s.link}>{expanded===tip.id?"Weniger anzeigen":"Tipp lesen"}</Text></TouchableOpacity>
      </View>)}
    </>}
  </View>;
}

const s = StyleSheet.create({
  section:{gap:12}, input:{backgroundColor:"#111716",borderColor:"#34443C",borderWidth:1,borderRadius:8,padding:14,color:"#F4F7F5",minHeight:48},
  categories:{gap:8}, chip:{paddingHorizontal:14,paddingVertical:12,borderRadius:20,backgroundColor:"#18201E"}, selected:{backgroundColor:"#7CFF6B"},selectedText:{color:"#0B0F0E",fontWeight:"800"},
  card:{backgroundColor:"#111716",borderColor:"#34443C",borderWidth:1,borderRadius:12,padding:18,gap:12},label:{color:"#8D9A95",fontSize:12,fontWeight:"800"},title:{color:"#F4F7F5",fontSize:18,fontWeight:"800"},body:{color:"#DCE5E1",fontSize:14,lineHeight:21},details:{gap:10},tags:{color:"#8D9A95",fontSize:12},link:{color:"#7CFF6B",fontSize:14,fontWeight:"800",paddingVertical:8},error:{color:"#FFB3B3",lineHeight:21},
});
