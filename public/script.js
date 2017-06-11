function validate(){
var title = document.getElementById('submit').value;
var options = document.getElementById('options').value;

  if (options.includes(',') && !options.endsWith(',')){
    alert("You've created a poll");
    return true;
}

alert("Please check syntax!");
return false;

}
function voted(){
  alert("You've succesfully voted!");
  return true;
}
