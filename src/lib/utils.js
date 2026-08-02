export function calculateAge(person) {
  if (!person.birth_date) return null;
  const birth = new Date(person.birth_date);
  let end = new Date();
  
  if (!person.is_living && person.death_date) {
    end = new Date(person.death_date);
  } else if (!person.is_living && !person.death_date) {
    return null; // Deceased but unknown death date, can't calc age exactly
  }

  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}
