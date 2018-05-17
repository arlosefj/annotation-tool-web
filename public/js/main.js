	//撤销的array
	var cancelList = new Array();
	//撤销的次数
	var cancelIndex = 0;

	var alpha_matte;

	var gotMatte = false;
	var fileLoaded = false;

	var socket = io.connect();
	socket.on('retImg', function (info) {
		clearContext('1');
        var alpha = new Image();
		alpha.onload = function() {
    		var canvas_tmp = document.createElement('canvas');
    		canvas_tmp.width = canvasWidth;
			canvas_tmp.height = canvasHeight;
    		var context_tmp = canvas_tmp.getContext('2d');
			context_tmp.drawImage(alpha, 0, 0, canvasWidth, canvasHeight);
			var alpha_array = context_tmp.getImageData(0, 0, canvas.width, canvas.height)

			var matFromCanvas = cv.matFromArray(alpha_array, 24);
			alpha_matte = matFromCanvas.clone();
			matFromCanvas.delete();
			var mask = new cv.Mat();
			cv.cvtColor(alpha_matte, mask, cv.ColorConversionCodes.COLOR_RGBA2GRAY.value, 0);
			cv.threshold(mask, mask, thresh, 255, cv.ThresholdTypes.THRESH_BINARY.value);
			show_image(mask, 'canvas3');
			mask.delete();
			masking();
			gotMatte = true;
		};
        alpha.src = 'data:image/png;base64,' + info.buffer;
        // socket.emit('msg', 'retImg');
    });

    var thresh = 127;

	$(function(){
		initCanvas();
		initDrag();

		// 绑定绘画板工具
		$(".pencil").live("click",function(){
			draw_graph('pencil',this);
		});
		$(".handwriting").live("click",function(){
			draw_graph('handwriting',this);
		});
		$(".showLine").live("click",function(){
			showLineSize(this);
		});

		$(".rubber").live("click",function(){
			draw_graph('rubber',this);
		});
		// $(".drawLine").live("click",function(){
		// 	draw_graph('line',this);
		// });
		$(".square").live("click",function(){
			draw_graph('square',this);
		});
		// $(".circle").live("click",function(){
		// 	draw_graph('circle',this);
		// });
		// $(".fill").live("click",function(){
		// 	fill(this);
		// });
		$(".cancel").live("click",function(){
			cancel(this);
		});
		$(".next").live("click",function(){
			next(this);
		});
		$(".clearContext").live("click",function(){
			clearContext('1');
		});
		$(".save").live("click",function(){
			save();
			$("body,html").animate({scrollTop:550},200);
		});
		$(".downloadImage").live("click",function(){
			downloadImage();
		});

		$(".grabcut").live("click",function(){
			grabcut();
		});
		$(".matting").live("click",function(){
			matting();
		});
		$(".closing").live("click",function(){
			closing();
		});
		$(".inputfile").live("click",function(){
			document.getElementById("input").click();
		});


		// 初始化铅笔工具
		$(".draw_controller li:first").click();

		// 选择线条大小
		$(".line_size button").click(function(){
			$(".line_size button").removeClass('current');
			$(this).addClass('current');
			size = $(this).data("value");
			$("#line_size").hide();
		});

		// 隐藏线条宽度板
		$(".line").hover(function(){
			showLineSize($(this)[0]);
		},function(){
			var ss=setTimeout(function(){
				$(".line_size").fadeOut(200);
			},100);
			$(".line_size").hover(function(){
				$(".line_size").show();
				clearTimeout(ss);
			},function(){
				$(".line_size").fadeOut(200);
			});
		});

		//选择颜色
		$(".showColor").bigColorpicker(function(el,icolor){
			color = icolor;
		});
		$("#f333").bigColorpicker("f3","L",6);
	});

	//下载图片
	var downloadImage = function(){
		$("#downloadImage_a")[0].href=canvas2.toDataURL();
	}

	//展开线条大小选择器
	var showLineSize = function(obj){
		if($("#line_size").is(":hidden")){
			var top = $(obj).offset().top+40;
			var left = $(obj).offset().left-10;
			$("#line_size")[0].style.left = left + "px";
			$("#line_size")[0].style.top = top   + "px";
			$("#line_size").show();
		}else{
			$("#line_size").hide();
		}
	}

	//选择大小
	var chooseLineSize =  function(_size){
		size = _size;
		$("#line_size").hide();
	}

	// 填充前景
	var fill=function(){
		context.fillStyle= color;
		context_bak.fillStyle= color;
		var $canvas = $("#canvas"),
			w = $canvas.width(),
			h = $canvas.height();
			context.fillRect(0, 0, w, h);
			context2.fillRect(0, 0, w, h);
			var image = new Image();
			image.src = canvas_bak.toDataURL();
			context.drawImage(image , 0 ,0 , image.width , image.height , 0 ,0 , canvasWidth , canvasHeight);
			context2.drawImage(image , 0 ,0 , image.width , image.height , 0 ,0 , canvasWidth , canvasHeight);
			clearContext();
			saveImageToAry();
	}


	//撤销上一个操作
	var cancel = function(){
		cancelIndex++;
		context.clearRect(0,0,canvasWidth,canvasHeight);
		context2.clearRect(0,0,canvasWidth,canvasHeight);
		var  image = new Image();
		var index = cancelList.length-1 - cancelIndex  ;
		var url = cancelList[index];
		image.src = url;
		image.onload = function(){
			context.drawImage(image , 0 ,0 , image.width , image.height , 0 ,0 , canvasWidth , canvasHeight);
			context2.drawImage(image , 0 ,0 , image.width , image.height , 0 ,0 , canvasWidth , canvasHeight);
			masking();
		}
	}

	//重做上一个操作
	var next = function(){
		cancelIndex--;
		context.clearRect(0,0,canvasWidth,canvasHeight);
		context2.clearRect(0,0,canvasWidth,canvasHeight);
		var  image = new Image();
		var index = cancelList.length-1 - cancelIndex  ;
		var url = cancelList[index];
		image.src = url;
		image.onload = function(){
			context.drawImage(image , 0 ,0 , image.width , image.height , 0 ,0 , canvasWidth , canvasHeight);
			context2.drawImage(image , 0 ,0 , image.width , image.height , 0 ,0 , canvasWidth , canvasHeight);
			masking();
		}
	}

	//保存历史 用于撤销
	var saveImageToAry = function (){
		cancelIndex = 0;
		var dataUrl =  canvas.toDataURL();
		cancelList.push(dataUrl);
	}

    // 处理文件拖入事件，防止浏览器默认事件带来的重定向
    function handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
     }


	// 判断是否图片
	function isImage(type) {
		switch (type) {
		case 'image/jpeg':
		case 'image/png':
		case 'image/gif':
		case 'image/bmp':
		case 'image/jpg':
			return true;
		default:
			return false;
		}
	}


	 // 处理拖放文件列表
	function handleFileSelect(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		var files = evt.dataTransfer.files;

		for (var i = 0, f; f = files[i]; i++) {
			var t = f.type ? f.type : 'n/a';
			reader = new FileReader();
			isImg = isImage(t);

			// 处理得到的图片
			if (isImg) {
				reader.onload = (function (theFile) {
					return function (e) {
						var  image = new Image();
						image.src =  e.target.result ;

						img.onload = function() {
	    						canvasWidth = 600;
	    						canvasHeight = 600;
						        var scaleFactor=Math.min((canvasWidth/img.width),(canvasHeight/img.height));
								canvasWidth = img.width*scaleFactor;
								canvasHeight = img.height*scaleFactor;
								canvas.width = canvasWidth;
								canvas.height = canvasHeight;
								canvasTop = $(canvas).offset().top;
								canvasLeft = $(canvas).offset().left;
								canvas_bak.width = canvasWidth;
								canvas_bak.height = canvasHeight;
								canvas_img.width = canvasWidth;
								canvas_img.height = canvasHeight;
								canvas2.width = canvasWidth;
								canvas2.height = canvasHeight;
				
								context_img.drawImage(img,0,0,img.width*scaleFactor,img.height*scaleFactor);
	    						fileLoaded = true;
								gotMatte = false;
	    				}
					};
				})(f)
				reader.readAsDataURL(f);
			}
		}
	}

	//初始化拖入效果
	var initDrag= function(){
		var dragDiv  = document.getElementById("canvas_img");
		dragDiv.addEventListener('dragover', handleDragOver, false);
		dragDiv.addEventListener('drop', handleFileSelect, false);
	}

	//初始化
	var initCanvas = function(){
		canvas =  document.getElementById("canvas");
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		context = canvas.getContext('2d');

		canvasTop = $(canvas).offset().top;
		canvasLeft = $(canvas).offset().left;

		canvas_bak =  document.getElementById("canvas_bak");
		canvas_bak.width = canvasWidth;
		canvas_bak.height = canvasHeight;
		context_bak = canvas_bak.getContext('2d');

		canvas_img =  document.getElementById("canvas_img");
		canvas_img.width = canvasWidth;
		canvas_img.height = canvasHeight;
		context_img = canvas_img.getContext('2d');

		canvas2 =  document.getElementById("canvas3");
		canvas2.width = canvasWidth;
		canvas2.height = canvasHeight;
		context2 = canvas2.getContext('2d');

		canvas3 =  document.getElementById("canvas2");
		canvas3.width = canvasWidth;
		canvas3.height = canvasHeight;
		context3 = canvas3.getContext('2d');

		inputElement = document.getElementById("input");
		inputElement.addEventListener("change", handleFiles, false);
	}

	//在画布上显示OpenCV图像
	var show_image = function(mat, canvas_id) {
		var data = mat.data(); 	// output is a Uint8Array that aliases directly into the Emscripten heap

		channels = mat.channels();
		channelSize = mat.elemSize1();

		var canvas = document.getElementById(canvas_id);

		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		canvas.width = mat.cols;
		canvas.height = mat.rows;

		imdata = ctx.createImageData(mat.cols, mat.rows);

		for (var i = 0,j=0; i < data.length; i += channels, j+=4) {
			imdata.data[j] = data[i];
			imdata.data[j + 1] = data[i+1%channels];
			imdata.data[j + 2] = data[i+2%channels];
			imdata.data[j + 3] = 255;
		}
		ctx.putImageData(imdata, 0, 0);
	}

	function handleFiles(e) {
	    var url = URL.createObjectURL(e.target.files[0]);
	    var img = new Image();
	    img.onload = function() {
	    		canvasWidth = 600;
	    		canvasHeight = 600;
		        var scaleFactor=Math.min((canvasWidth/img.width),(canvasHeight/img.height));
				canvasWidth = img.width*scaleFactor;
				canvasHeight = img.height*scaleFactor;
				canvas.width = canvasWidth;
				canvas.height = canvasHeight;
				canvasTop = $(canvas).offset().top;
				canvasLeft = $(canvas).offset().left;
				canvas_bak.width = canvasWidth;
				canvas_bak.height = canvasHeight;
				canvas_img.width = canvasWidth;
				canvas_img.height = canvasHeight;
				canvas2.width = canvasWidth;
				canvas2.height = canvasHeight;

				context_img.drawImage(img,0,0,img.width*scaleFactor,img.height*scaleFactor);
	    		fileLoaded = true;
				gotMatte = false;
	    }
	    img.src = url;
	}

	var getInput = function(canvas_id) {
		var canvas = document.getElementById(canvas_id);
		var ctx = canvas.getContext('2d');
		var imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
		return imgData;
	}

	var masking = function() {
		var matFromCanvas1 = cv.matFromArray(getInput('canvas_img'), 24); 
		var src = matFromCanvas1.clone();
		matFromCanvas1.delete();

		var mask = new cv.Mat();
		var matFromCanvas2 = cv.matFromArray(getInput('canvas3'), 24);
		cv.cvtColor(matFromCanvas2, mask, cv.ColorConversionCodes.COLOR_RGBA2GRAY.value, 0);
		matFromCanvas2.delete();

		var res = new cv.Mat();
		// var binary = new cv.Mat();
		cv.bitwise_and(src, src, res, mask);
		show_image(res, 'canvas2');

		src.delete();
		mask.delete();
		res.delete();
		// binary.delete();
	}

	var grabcut = function() {
		if (fileLoaded) {
			var url_img = canvas_img.toDataURL('image/png');
			var url_mask = canvas2.toDataURL('image/png');
			socket.emit('grabcut', url_img, url_mask);
		}
	}

	var matting = function() {
		if (fileLoaded) {
			var url_img = canvas_img.toDataURL('image/png');
			var url_mask = canvas2.toDataURL('image/png');
			socket.emit('matting', url_img, url_mask);
		}
	}

	var threshChange = function(value) {
		thresh = parseFloat(value);
		if (gotMatte) {
			var mask = new cv.Mat();
			cv.threshold(alpha_matte, mask, thresh, 255, cv.ThresholdTypes.THRESH_BINARY.value);
			show_image(mask, 'canvas3');
			mask.delete();
			masking();
		}
	}

	var closing = function() {
		var contours = new cv.MatVector();
		var hierarchy = new cv.Mat();
		var maxArea = 0;
		var maxIndex = -1;
		var matFromCanvas = cv.matFromArray(getInput('canvas3'), 24);
		var alpha_tmp = matFromCanvas.clone();
		matFromCanvas.delete();
		var cols = alpha_tmp.cols;
		var rows = alpha_tmp.rows;
		var color = new cv.Scalar(255, 255, 255);
		cv.cvtColor(alpha_tmp, alpha_tmp, cv.ColorConversionCodes.COLOR_RGBA2GRAY.value, 0);
		cv.findContours(alpha_tmp, contours, hierarchy, cv.RetrievalModes.RETR_EXTERNAL.value, cv.ContourApproximationModes.CHAIN_APPROX_SIMPLE.value, [0, 0]);
		for (var i = 0; i < contours.size(); i++) {
			var area = cv.contourArea(contours.get(i), false);
			if (area > maxArea) {
				maxArea = area;
				maxIndex = i;
			}
		}
		alpha_tmp.delete();
		var alpha_tmp = cv.Mat.zeros(rows, cols, 24);
		cv.drawContours(alpha_tmp, contours, maxIndex, color, -1, 8, hierarchy, 0, [0, 0]);
		color.delete();
		show_image(alpha_tmp, 'canvas3');
		masking();
	}