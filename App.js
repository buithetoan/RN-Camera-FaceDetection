import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { RNCamera } from 'react-native-camera';
import {Table, Row, Col} from 'react-native-table-component';
import RNFetchBlob from 'rn-fetch-blob';
const landmarkSize = 2;
export default class CameraScreen extends React.Component {
  state = {
    ratio: '16:9',
    faces: [],
    tableHead: ['EmployeeNo', 'TimeIn', 'TimeOut'],
    flexArr: [2,2,2],
    employeeNo: 'Unknown',
    timeIn: null,
    timeOut: null,    
    arrEmployeeNo : [],
    arrTimeIn : [],
    arrTimeOut: [],
    timeSteep:false,
  };  
  facesDetected = async ({faces}) => {
    this.setState({faces});
    if(this.state.faces[0] && this.camera && this.state.timeSteep == false){
      const options = { quality: 0.5, base64: true }; 
      const data= await this.camera.takePictureAsync(options);
      if (this.state.timeSteep == false) {
        this.setState({timeSteep : true});
        RNFetchBlob
        .fetch('POST', 'http://faceapi2020.azurewebsites.net/identifyFace', {'Content-Type' : 'multipart/form-data'}, 
        [
          { name : 'fileImage', filename : 'image.jpg', type:'image/jpg', data: RNFetchBlob.wrap(data.uri)},
          { name : 'personGroupId', data : 'camera-rn-group-1'},
        ])
        .then(response => response.json())
        .then(json => {
          this.setState({timeSteep: false});
          console.log(json);
          if(json.flag == true){
            this.setState({
              dataResult : json.data[0],
              employeeNo: json.data[0].employeeNo,
              timeIn: json.data[0].dateTime,
              timeOut: json.data[0].dateTime,
            })
          }else this.setState({dataResult: null, employeeNo: 'Unknown', timeIn: null, timeOut: null});
        })
        .catch((err) => {
          this.setState({timeSteep: false});
          console.log("error");
        });   
      }                
    }
  }
  renderFace = ({ bounds, faceID, rollAngle, yawAngle }) => (
    <View
      key={faceID}
      transform={[
        { perspective: 600 },
        { rotateZ: `${rollAngle.toFixed(0)}deg` },
        { rotateY: `${yawAngle.toFixed(0)}deg` },
      ]}
      style={[
        styles.face,
        {
          ...bounds.size,
          left: bounds.origin.x,
          top: bounds.origin.y,
        },
      ]}
    >
    </View>
  );

  renderLandmarksOfFace(face) {
    const renderLandmark = position =>
      position && (
        <View
          style={[
            styles.landmark,
            {
              left: position.x - landmarkSize / 2,
              top: position.y - landmarkSize / 2,
            },
          ]}
        />
      );
    return (
      <View key={`landmarks-${face.faceID}`}>
        {renderLandmark(face.leftEyePosition)}
        {renderLandmark(face.rightEyePosition)}
        {renderLandmark(face.leftEarPosition)}
        {renderLandmark(face.rightEarPosition)}
        {renderLandmark(face.leftCheekPosition)}
        {renderLandmark(face.rightCheekPosition)}
        {renderLandmark(face.leftMouthPosition)}
        {renderLandmark(face.mouthPosition)}
        {renderLandmark(face.rightMouthPosition)}
        {renderLandmark(face.noseBasePosition)}
        {renderLandmark(face.bottomMouthPosition)}
      </View>
    );
  }

  renderFaces = () => (
    <View style={styles.facesContainer} pointerEvents="none">
      {this.state.faces.map(this.renderFace)}
    </View>
  );
  
  renderLandmarks = () => (
    <View style={styles.facesContainer} pointerEvents="none">
      {this.state.faces.map(this.renderLandmarksOfFace)}
    </View>
  );
  renderCamera(arrEmployeeNo, arrTimeIn, arrTimeOut) {    
    return (
      <RNCamera
        ref={ref => {
          this.camera = ref;
        }}
        style={{
          flex: 1,
        }}
        type={RNCamera.Constants.Type.front}
        flashMode={this.state.flash}
        ratio={this.state.ratio}
        trackingEnabled
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}
        faceDetectionLandmarks={
          RNCamera.Constants.FaceDetection.Landmarks
            ? RNCamera.Constants.FaceDetection.Landmarks.all
            : undefined
        }
        faceDetectionClassifications={
          RNCamera.Constants.FaceDetection.Classifications
            ? RNCamera.Constants.FaceDetection.Classifications.all
            : undefined
        }
        onFacesDetected={this.state.timeSteep == false ? this.facesDetected.bind(this) :null}
      >    
        <View style={{flex: 1}}>
          {this.state.timeSteep == false ? this.renderFaces() : null}
          {this.state.timeSteep == false ? this.renderLandmarks() : null}
        </View>
        <View style={{height: 200, zIndex: 2,backgroundColor:'powderblue'}}>
          <Table borderStyle={{borderWidth: 1}}>
            <Row data={this.state.tableHead} flexArr={[2, 2, 2,]} style={styles.head} textStyle={styles.text}/>
          </Table>
          <ScrollView>
            <Table style={styles.wrapper} borderStyle={{borderWidth: 1}}>
            <Col data={arrEmployeeNo} style={styles.title} heightArr={[28,28]} textStyle={styles.text}/>
                <Col data={arrTimeIn} style={styles.title} heightArr={[28,28]} textStyle={styles.text}/>
                <Col data={arrTimeOut} style={styles.title} heightArr={[28,28]} textStyle={styles.text}/> 
            </Table>
          </ScrollView>
        </View>        
      </RNCamera>
    );
  } 
  
  render() {
    const {arrEmployeeNo, arrTimeIn, arrTimeOut, employeeNo, timeIn, timeOut} = this.state;
    if(employeeNo !== 'Unknown'){
      let index = arrEmployeeNo.indexOf(employeeNo);  
      if(index !== -1){
        arrEmployeeNo[index] = arrEmployeeNo[index];
        arrTimeIn[index] = arrTimeIn[index];
        arrTimeOut[index] = timeOut;
        if(arrTimeIn[index] = arrTimeOut[index]) arrTimeOut[index] == "";
      }else{
        arrEmployeeNo.push(employeeNo);
        arrTimeIn.push(timeIn);   
        arrTimeOut.push("");
      }
    }    
    return(      
      <View style={{flex: 1, zIndex: 0}}>{this.renderCamera(this.state.arrEmployeeNo, this.state.arrTimeIn, this.state.arrTimeOut)}</View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#000',
  },
  facesContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
  },
  face: {
    borderWidth: 2,
    borderRadius: 2,
    position: 'absolute',
    borderColor: '#FFD700',
    justifyContent: 'center',
  },
  landmark: {
    width: landmarkSize,
    height: landmarkSize,
    position: 'absolute',
    backgroundColor: 'red',
  },
  head: { 
    height: 30, 
    backgroundColor: 'powderblue' 
  },
  text: { 
    textAlign: 'center', 
    fontWeight: '200' ,
  },
  dataWrapper: { 
    marginTop: -1 
  },
  row: { 
    height: 40, 
    backgroundColor: '#F7F8FA' 
  },
  faceText: {
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical:'bottom',
    margin: 10,
    backgroundColor: 'transparent',
  },
  wrapper: { flexDirection: 'row' },
});