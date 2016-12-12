import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'

import CachedUsers from './CachedUsers/CachedUsers.ui'
import Loader from './Loader/Loader.ui'
import ErrorModal from './ErrorModal/ErrorModal.ui'
import Login from './Login/Login.ui'
import LoginWithPin from './Login/LoginWithPin.ui'

import { openLogin } from './Login/Login.action'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { Button } from 'native-base'
import appTheme from '../../Themes/appTheme'
import t from '../lib/LocaleStrings'

import Dimensions from 'Dimensions'
const { width, height } = Dimensions.get('window')

class Main extends Component {

  handleOpenLogin = () => {
    this.props.dispatch(openLogin())
  }
  containerTouched = (event) => {
    console.log('hmm this is for iOs huh')
    this.refs.loginUsername.blur();
    return false;
  }
  render () {
    if (this.props.pin) {
      return (
        <View style={styles.main}>
          <LoginWithPin />
        </View>
      )
    }

    if (!this.props.pin) {
      if (this.props.password) {
        return (
          <View style={styles.main} onStartShouldSetResponder={this.containerTouched.bind(this)}>
            <Login />
            <TouchableOpacity style={[ styles.button, { backgroundColor: '#2291CF' }]} onPress={Actions.signup}>
              <Text style={styles.buttonText}>{t('fragment_landing_signup_button')}</Text>
            </TouchableOpacity>
          </View>
        )
      }

      if (!this.props.password) {
        return (
          <View style={styles.main}>
            <TouchableOpacity style={[ styles.button, { backgroundColor: '#80C342' }]} onPress={this.handleOpenLogin}>
              <Text style={styles.buttonText}>{t('fragment_landing_signin_button')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ styles.button, { backgroundColor: '#2291CF' }]} onPress={Actions.signup}>
              <Text style={styles.buttonText}>{t('fragment_landing_signup_button')}</Text>
            </TouchableOpacity>
          </View>
        )
      }
    }
  }

}

class HomeComponent extends Component {

  render () {
    return (
      <Image source={require('../assets/drawable/background.jpg')} resizeMode='cover' style={styles.backgroundImage}>
        <Image source={require('../assets/drawable/logo.png')} style={styles.logoImage} />
        <Main {...this.props} />
        <Loader />
        <ErrorModal />
      </Image>
    )
  }

}

const styles = StyleSheet.create({

  main: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    margin: 10,
    flex: 3
  },

  welcome: {
    fontSize: 30,
    textAlign: 'left',
    margin: 10,
    color: '#FFFFFF'
  },

  backgroundImage: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'cover',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  logoImage: {
    flex: 1,
    justifyContent: 'center',
    resizeMode: 'contain',
    width: width * 0.5
  },

  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    width: width * 0.6,
    height: 45
  },

  buttonText: {
    textAlign: 'center',
    color: '#FFF',
    fontSize: 22,
    flex: 1
  }

})

export default connect(state => ({

  password: state.login.viewPassword,
  selectedUserToLogin: state.cachedUsers.selectedUserToLogin,
  pin: state.login.viewPIN

}))(HomeComponent)
