import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { View, Text, TouchableOpacity } from 'react-native';
import { WorkoutExerciseEditor } from '../../src/components/WorkoutExerciseEditor';
import { TemplateAdoptionModal } from '../../src/components/TemplateAdoptionModal';
import { initialWorkouts } from '../../src/data/workouts';
import { workoutTemplates } from '../../src/data/templates';
import { exercises } from '../../src/data/exercises';
import { createWorkoutFromTemplate } from '../../src/domain/workoutTemplates';
function Harness() {
  const [editor,setEditor]=useState(false); const [modal,setModal]=useState(false);
  const [attempts,setAttempts]=useState(0); const [templateAttempts,setTemplateAttempts]=useState(0);
  const [day,setDay]=useState(initialWorkouts[0]);
  return <View><TouchableOpacity accessibilityRole="button" onPress={()=>setEditor(true)}><Text>Editor öffnen</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={()=>setModal(true)}><Text>Vorlage öffnen</Text></TouchableOpacity><Text>{`Gespeichert: ${day.exercises?.[0].sets}; Titel: ${day.title}`}</Text>
    {editor ? <WorkoutExerciseEditor workout={day} onClose={()=>setEditor(false)} onSave={async rows=>{setAttempts(attempts+1); if(!attempts)throw Error('Test failure'); setDay({...day,exercises:rows});}}/>:null}
    <TemplateAdoptionModal visible={modal} template={workoutTemplates[1]} days={[day]} onClose={()=>setModal(false)} onSubmit={async(_,time)=>{setTemplateAttempts(templateAttempts+1); if(!templateAttempts)throw Error('Test failure');setDay(createWorkoutFromTemplate(workoutTemplates[1],day,time,exercises));}}/>
  </View>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
