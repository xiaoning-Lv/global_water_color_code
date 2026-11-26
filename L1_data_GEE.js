// 替换为你上传后的路径
var points = ee.FeatureCollection("projects/ee-ljn981827485/assets/lake_sampling_points_300m_all");

var test = points.first();
var coords = test.geometry().coordinates();
print(ee.Geometry.Point(0,0))
print('coords:', coords);
print('coords type:', coords.getInfo());

// 载入 tile 多边形
var tileshp = ee.FeatureCollection("users/whutsjp/IMWtiles");



var tile_list = tileshp.toList(tileshp.size());


function ValueandExport8(thisimg0){
  var thisimg = ee.Image(thisimg0);
  var thisbounds = thisimg.geometry();//thisimg.get("geometry");//thisimg.geometry();//.get("geometry");
  
  var PointValue = thisimg.reduceRegions({
      collection: grwlpoint.filterBounds(thisbounds),
      reducer: ee.Reducer.mean(),
      scale: 30,
      tileScale: 1,
    });
  PointValue = PointValue.filter(ee.Filter.notNull(['QA_PIXEL', 'QA_RADSAT']))
  var output_imginfo = ee.Feature(ee.Geometry.Point(0,0))
                        .set('DATE_ACQUIRED',thisimg.get('DATE_ACQUIRED'))
                        .set('SCENE_CENTER_TIME',thisimg.get('SCENE_CENTER_TIME'))
                        .set('SUN_AZIMUTH',thisimg.get('SUN_AZIMUTH'))
                        .set('SUN_ELEVATION',thisimg.get('SUN_ELEVATION'))
                        .set('x',0);
  
                        
  // print('test_headinfo',output_imginfo)                      
  var PointValueout = ee.FeatureCollection(output_imginfo).merge(PointValue);
  
  // print('test_SPM',thisimg,thisbounds,thisdate,SPM,PointValue.limit(3))
  return ee.FeatureCollection(PointValueout);
}

for (var grwli = 298;grwli<299;grwli++){
  var roi = tileshp.filter(ee.Filter.eq("IMW_ID", 298)).first();
  var loncore = ee.Number(roi.get('Lonmin')), latcore = ee.Number(roi.get('Latmin')); 
  roi = roi.geometry()

  var GridTitle = String(grwli)//thisriver.get("id_no").getInfo();
  // var outfolder = "GlobalRiver_Landsat_dnL578_"+GridTitle+"_Point";
  var outfolder = "clone_test";
  // var outfolder = "GlobalRiver_Landsat_dnL8_IMWid_"+string(IMW_ID[grwli])+"MASKid_"+GridTitle+"_Point";
  // Map.addLayer(roi,{color: 'FF0000'});
  // print('outfolder',outfolder)
  

  
  var grwlpoint_GQ = points.filterBounds(roi);//.filter(ee.Filter.gt('width',180))//.filter(ee.Filter.eq('lakeFlag',0));
  var ngrwlpoint_GQ = grwlpoint_GQ.size().getInfo();
  var grwlpoint = grwlpoint_GQ;
  var ngrwlpoint = ngrwlpoint_GQ;
  
  if (ngrwlpoint === 0) {
    print("Grid_id: ", grwli," don't have river point.")
    continue;
  }
  
  
  
  //***********Set your path**********
  // Landsat 8
  var startday = ee.Date("2013-01-01");
  var endday = ee.Date("2024-01-01");
  var thisimgs8 = ee.ImageCollection("LANDSAT/LC08/C02/T1")
                    .filterDate(startday,endday)
                    .filterBounds(roi)
  
  var n8 = thisimgs8.size().getInfo();
  print('n8_1:',n8);
  print('ngrwlpoint:',ngrwlpoint);
  var batchn = 200;
  
  
  if (n8>0&&ngrwlpoint>10){
    var L8Listmosaic = thisimgs8.toList(n8);
    var L8SPMAll = ee.FeatureCollection(ee.Feature(ee.Geometry.Point(0, 0)).set('date',GridTitle+'L8'));
    // print('test_L8SPMAll',loncore,latcore,L8SPMAll)
    var flag = 0;
    for (var i = 0;i<n8;i++){////n8
          L8SPMAll = L8SPMAll.merge(ValueandExport8(L8Listmosaic.get(i)));
          flag = 1;
          if ((i+1)%batchn === 0){
            //print('***Aggreation is over batchn, we output current data***');
            Export.table.toDrive({
                    collection: L8SPMAll,
                    description: 'newGQpoint_'+GridTitle+'_dnL8_'+String(Math.floor((i+1)/batchn)),
                    folder: outfolder,
                    fileNamePrefix: 'newGQpoint_'+GridTitle+'_dnL8_'+String(Math.floor((i+1)/batchn)),
                    fileFormat: 'CSV', 
                    selectors: ['x','id','lon','lat','width_int',
                        'DATE_ACQUIRED', 'SCENE_CENTER_TIME', 'SUN_AZIMUTH','SUN_ELEVATION',
                        'B1','B2','B3','B4','B5','B6','B7','B8','B9','QA_PIXEL','QA_RADSAT',
                        'SAA','SZA','VAA','VZA']
            });
            L8SPMAll = ee.FeatureCollection(ee.Feature(ee.Geometry.Point(loncore, latcore)).set('date',GridTitle+'L8'));
            flag = 0;
          }
    }
    if (flag == 1){
      Export.table.toDrive({
              collection: L8SPMAll,
              description: 'newGQpoint_'+GridTitle+'_dnL8_'+String(Math.floor((i+1)/batchn)+1),
              folder: outfolder,
              fileNamePrefix: 'newGQpoint_'+GridTitle+'_dnL8_'+String(Math.floor((i+1)/batchn)+1),
              fileFormat: 'CSV', 
              selectors: ['x','id','lon','lat','width_int',
                        'DATE_ACQUIRED', 'SCENE_CENTER_TIME', 'SUN_AZIMUTH','SUN_ELEVATION',
                        'B1','B2','B3','B4','B5','B6','B7','B8','B9','QA_PIXEL','QA_RADSAT',
                        'SAA','SZA','VAA','VZA']
            });
    }
  }
  
  
  // Landsat 7
  var startday = ee.Date("1999-05-28");
  var endday = ee.Date("2024-01-01");//landsat 7 only update to 2024-01-19
  var thisimgs7 = ee.ImageCollection("LANDSAT/LE07/C02/T1")
              .filterDate(startday,endday)
              .filterBounds(roi)

  var n7 = thisimgs7.size().getInfo();            
  print('n7:',n7);
  
  
  if (n7>0 && ngrwlpoint>10){
    var L7Listmosaic = thisimgs7.toList(n7);
    var L7SPMAll = ee.FeatureCollection(ee.Feature(ee.Geometry.Point(0, 0)).set('date',GridTitle+'L7'));
    var flag = 0;
    for (i = 0;i<n7;i++){
          //print(GridTitle+'num8:',i+1,'/',num8);
          L7SPMAll = L7SPMAll.merge(ValueandExport8(L7Listmosaic.get(i)));
          flag = 1;
          if ((i+1)%batchn === 0){
            //print('***Aggreation is over batchn, we output current data***');
            Export.table.toDrive({
                    collection: L7SPMAll,
                    description: 'newGQpoint_'+GridTitle+'_dnL7_'+String(Math.floor((i+1)/batchn)),
                    folder: outfolder,
                    fileNamePrefix: 'newGQpoint_'+GridTitle+'_dnL7_'+String(Math.floor((i+1)/batchn)),
                    fileFormat: 'CSV', 
                    selectors: ['x','id','lon','lat','width_int',
                        'DATE_ACQUIRED', 'SCENE_CENTER_TIME', 'SUN_AZIMUTH','SUN_ELEVATION',
                        'B1','B2','B3','B4','B5','B6_VCID_1','B6_VCID_2','B7','B8','QA_PIXEL','QA_RADSAT',
                        'SAA','SZA','VAA','VZA']
            });
            L7SPMAll = ee.FeatureCollection(ee.Feature(ee.Geometry.Point(loncore, latcore)).set('date',GridTitle+'L7'));
            flag = 0;
          }
    }
    if (flag == 1){
      Export.table.toDrive({
              collection: L7SPMAll,
              description: 'newGQpoint_'+GridTitle+'_dnL7_'+String(Math.floor((i+1)/batchn)+1),
              folder: outfolder,
              fileNamePrefix: 'newGQpoint_'+GridTitle+'_dnL7_'+String(Math.floor((i+1)/batchn)+1),
              fileFormat: 'CSV', 
              selectors: ['x','id','lon','lat','width_int',
                        'DATE_ACQUIRED', 'SCENE_CENTER_TIME', 'SUN_AZIMUTH','SUN_ELEVATION',
                        'B1','B2','B3','B4','B5','B6_VCID_1','B6_VCID_2','B7','B8','QA_PIXEL','QA_RADSAT',
                        'SAA','SZA','VAA','VZA']
            });
    }
  }
  
  
  

  // Landsat 5
  var startday = ee.Date("1984-03-16");
  var endday = ee.Date("2012-05-06");//landsat 5 only update to 2012-05-05
  var thisimgs5 = ee.ImageCollection("LANDSAT/LT05/C02/T1")
              .filterDate(startday,endday)
              .filterBounds(roi)

  var n5 = thisimgs5.size().getInfo();            
  print('n5:',n5);
  // print('ngrwlpoint:',ngrwlpoint);
  
  
  if (n5>0&&ngrwlpoint>10){
    var L5Listmosaic = thisimgs5.toList(n5);
    var L5SPMAll = ee.FeatureCollection(ee.Feature(ee.Geometry.Point(0, 0)).set('date',GridTitle+'L5'));
    var flag = 0;
    for (i = 0;i<n5;i++){
          //print(GridTitle+'num8:',i+1,'/',num8);
          L5SPMAll = L5SPMAll.merge(ValueandExport8(L5Listmosaic.get(i)));
          flag = 1;
          if ((i+1)%batchn === 0){
            //print('***Aggreation is over batchn, we output current data***');
            Export.table.toDrive({
                    collection: L5SPMAll,
                    description: 'newGQpoint_'+GridTitle+'_dnL5_'+String(Math.floor((i+1)/batchn)),
                    folder: outfolder,
                    fileNamePrefix: 'newGQpoint_'+GridTitle+'_dnL5_'+String(Math.floor((i+1)/batchn)),
                    fileFormat: 'CSV', 
                    selectors: ['x','id','lon','lat','width_int',
                        'DATE_ACQUIRED', 'SCENE_CENTER_TIME', 'SUN_AZIMUTH','SUN_ELEVATION',
                        'B1','B2','B3','B4','B5','B6','B7','QA_PIXEL','QA_RADSAT', 'SAA','SZA','VAA','VZA']
            });
            L5SPMAll = ee.FeatureCollection(ee.Feature(ee.Geometry.Point(loncore, latcore)).set('date',GridTitle+'L5'));
            flag = 0;
          }
    }
    if (flag == 1){
      Export.table.toDrive({
              collection: L5SPMAll,
              description: 'newGQpoint_'+GridTitle+'_dnL5_'+String(Math.floor((i+1)/batchn)+1),
              folder: outfolder,
              fileNamePrefix: 'newGQpoint_'+GridTitle+'_dnL5_'+String(Math.floor((i+1)/batchn)+1),
              fileFormat: 'CSV', 
              selectors: ['x','id','lon','lat','width_int',
                        'DATE_ACQUIRED', 'SCENE_CENTER_TIME', 'SUN_AZIMUTH','SUN_ELEVATION',
                        'B1','B2','B3','B4','B5','B6','B7','QA_PIXEL','QA_RADSAT', 'SAA','SZA','VAA','VZA']
            });
    }
  }
  
}
