function viewImage(event){
    let image=document.getElementById("formImages")
    image.style.display='flex';
    image.classList.add("formImages");
    document.getElementById('imgview').src= URL.createObjectURL(event.target.files[0])
    document.getElementById('imgview1').src= URL.createObjectURL(event.target.files[1])
    document.getElementById('imgview2').src= URL.createObjectURL(event.target.files[2])
    document.getElementById('imgview3').src= URL.createObjectURL(event.target.files[3])
}

function viewImage1(event){
    document.getElementById('imgview').src= URL.createObjectURL(event.target.files[0])
    document.getElementById('imgview1').src= URL.createObjectURL(event.target.files[1])
    document.getElementById('imgview2').src= URL.createObjectURL(event.target.files[2])
    document.getElementById('imgview3').src= URL.createObjectURL(event.target.files[3])
}

