

function ncnn_nanodet() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;

    HEAPU8.set(data, dst);

    _nanodet_ncnn(dst, canvas.width, canvas.height);

    var result = HEAPU8.subarray(dst, dst + data.length);
    //console.log(result)

    imageData.data.set(result);
    ctx.putImageData(imageData, 0, 0);
}