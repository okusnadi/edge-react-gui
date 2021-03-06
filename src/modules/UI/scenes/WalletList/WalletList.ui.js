// @flow
import React, {Component} from 'react'
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  FlatList
} from 'react-native'
// $FlowFixMe: suppressing this error until we can find a workaround
import Permissions from 'react-native-permissions'
import Contacts from 'react-native-contacts'
import T from '../../components/FormattedText'
import Ionicon from 'react-native-vector-icons/Ionicons'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import Gradient from '../../components/Gradient/Gradient.ui'
import {Actions} from 'react-native-router-flux'
import styles from './style'
import SortableListView from 'react-native-sortable-listview'
import FullWalletListRow from './components/WalletListRow/FullWalletListRowConnector'
import SortableWalletListRow from './components/WalletListRow/SortableWalletListRow.ui.js'
import strings from '../../../../locales/default'

import StylizedModal from '../../components/Modal/Modal.ui'
import * as UTILS from '../../../utils'

import DeleteWalletSubtext from './components/DeleteWalletSubtextConnector'
import DeleteWalletButtons from './components/DeleteWalletButtonsConnector'
import WalletNameInput from './components/WalletNameInputConnector'
import RenameWalletButtons from './components/RenameWalletButtonsConnector'
import DeleteIcon from './components/DeleteIcon.ui'
import RenameIcon from './components/RenameIcon.ui'
import platform from '../../../../theme/variables/platform.js'


const options = [
  {
    value: 'rename',
    syntax: strings.enUS['string_rename']
  },{
    value: 'sort',
    syntax: strings.enUS['fragment_wallets_sort']
  },{
    value: 'addToken',
    syntax: strings.enUS['fragmet_wallets_addtoken_option']
  },{
    value: 'archive'
  },{
    value: 'delete',
    syntax: strings.enUS['string_delete']
  }
]

const SHOW_BALANCE_TEXT = strings.enUS['string_show_balance']

export default class WalletList extends Component<any, {
  sortableMode: boolean,
  sortableListOpacity: number,
  fullListOpacity: number,
  sortableListZIndex: number,
  fullListZIndex: number,
  balanceBoxVisible: boolean
}> {
  constructor (props: any) {
    super(props)
    this.state = {
      sortableMode: false,
      sortableListOpacity: new Animated.Value(0),
      sortableListZIndex: new Animated.Value(0),
      fullListOpacity: new Animated.Value(1),
      fullListZIndex: new Animated.Value(100),
      balanceBoxVisible: true
    }
  }

  componentDidMount () {
    Permissions.request('contacts').then((response) => {
      if (response === 'authorized') {
        Contacts.getAll((err, contacts) => {
          if (err === 'denied') {
            // error
          } else {
            contacts.sort((a, b) => a.givenName > b.givenName)
            this.props.setContactList(contacts)
          }
        })
      }
    })
  }

  executeWalletRowOption = (walletId: string, option: string) => {
    switch (option) {
    case options[0].value: // 'rename'
      // console.log('executing rename')
      this.props.walletRowOption(walletId, 'rename')
      break
    case options[1].value: // 'sort'
      if (this.state.sortableMode) {
        this.disableSorting()
      } else {
        this.enableSorting()
      }
      break
    case options[2].value: // 'addToken'
      this.props.walletRowOption(walletId, 'addToken')
      break
    case options[3].value: // 'archive'
      if (!this.props.walletsp[walletId].archived) {
        this.props.walletRowOption(walletId, 'archive')
      } else {
        this.props.walletRowOption(walletId, 'activate')
      }
      break
    case options[4].value: // 'delete
      this.props.walletRowOption(walletId, 'delete')
      break
    }
  }
  render () {
    const {
      wallets,
      activeWalletIds,
      settings
    } = this.props
    let walletsArray = []
    let activeWallets = {}
    for (let wallet in wallets) {
      let theWallet = wallets[wallet]
      theWallet.key = wallet
      theWallet.executeWalletRowOption = this.executeWalletRowOption
      walletsArray.push(theWallet)
      if (activeWalletIds.includes(wallet)) activeWallets[wallet] = wallets[wallet]
    }

    let activeWalletsArray = activeWalletIds.map(function (x) {
      let tempWalletObj = {key: x}
      return wallets[x] || tempWalletObj
    })

    let activeWalletsObject = {}
    activeWalletIds.forEach(function (x) {
      let tempWalletObj = wallets[x] ? wallets[x] : {key: null}
      activeWalletsObject[x] = tempWalletObj
    })
    let fiatBalanceString
    let fiatSymbol = settings.defaultFiat ? UTILS.getFiatSymbol(settings.defaultFiat) : ''
    if (fiatSymbol.length !== 1) {
      fiatBalanceString =  this.tallyUpTotalCrypto() + ' ' + settings.defaultFiat
    } else {
      fiatBalanceString = fiatSymbol + ' ' + this.tallyUpTotalCrypto() + ' ' + settings.defaultFiat
    }

    return (
      <View style={styles.container}>
        {this.renderDeleteWalletModal()}
        {this.renderRenameWalletModal()}
        <Gradient style={{height: 66, width: '100%'}} />

        <TouchableOpacity onPress={this.handleOnBalanceBoxPress}>
          {this.state.balanceBoxVisible
          ? this.balanceBox(fiatBalanceString)
          : this.hiddenBalanceBox()}
        </TouchableOpacity>

        <View style={[styles.walletsBox]}>
          <Gradient style={[styles.walletsBoxHeaderWrap, UTILS.border()]}>

            <View style={[styles.walletsBoxHeaderTextWrap, UTILS.border()]}>
              <View style={styles.leftArea}>
                <SimpleLineIcons name='wallet' style={[styles.walletIcon]} color='white' />
                <T style={styles.walletsBoxHeaderText}>
                  {strings.enUS['fragment_wallets_header']}
                </T>
              </View>
            </View>

            <View style={[styles.donePlusContainer, UTILS.border()]}>

              <Animated.View style={[
                styles.doneContainer,
                UTILS.border(),
                {
                  opacity: this.state.sortableListOpacity,
                  zIndex: this.state.sortableListZIndex
                }]}>
                <TouchableOpacity style={[
                  styles.walletsBoxDoneTextWrap
                ]}
                  onPress={this.disableSorting}>
                  <T style={[styles.walletsBoxDoneText]}>
                    {strings.enUS['string_done_cap']}
                  </T>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={[
                styles.plusContainer,
                UTILS.border(),
                {
                  opacity: this.state.fullListOpacity,
                  zIndex: this.state.fullListZIndex
                }]}>
                <TouchableOpacity style={[
                  styles.walletsBoxHeaderAddWallet,
                  {width: 41}
                ]}
                  onPress={Actions.createWallet}>
                  <Ionicon name='md-add' style={[styles.dropdownIcon]} size={28} color='white' />
                </TouchableOpacity>
              </Animated.View>

            </View>
          </Gradient>

          {
            Object.keys(wallets).length > 0 ? this.renderActiveSortableList(activeWalletsArray, activeWalletsObject) : <ActivityIndicator style={{flex: 1, alignSelf: 'center'}} size={'large'} />
          }

        </View>
      </View>
    )
  }

  renderActiveSortableList = (activeWalletsArray: any, activeWalletsObject: any) => {
    const {width} = platform.deviceWidth
    return (
      <View style={[styles.listsContainer, UTILS.border()]}>
        <Animated.View testID={'sortableList'} style={[UTILS.border(), {flex: 1, opacity: this.state.sortableListOpacity, zIndex: this.state.sortableListZIndex}, styles.sortableList, UTILS.border()]}>
          <SortableListView
            style={{flex: 1, width}}
            data={activeWalletsObject}
            order={this.props.activeWalletIds}
            onRowMoved={this.onActiveRowMoved}
            render={strings.enUS['fragmet_wallets_list_archive_title_capitalized']}
            renderRow={(row) => <SortableWalletListRow data={row} dimensions={this.props.dimensions} />}
            executeWalletRowOption={this.executeWalletRowOption}
            dimensions={this.props.dimensions}
          />
        </Animated.View>
        <Animated.View testID={'fullList'} style={[{flex: 1, opacity: this.state.fullListOpacity, zIndex: this.state.fullListZIndex}, styles.fullList]}>
          <FlatList
            style={{flex: 1, width}}
            data={activeWalletsArray}
            extraData={this.props.wallets}
            renderItem={(item) => <FullWalletListRow data={item} />}
            sortableMode={this.state.sortableMode}
            executeWalletRowOption={this.executeWalletRowOption} />
        </Animated.View>
      </View>
    )
  }

  enableSorting = () => {
    // start animation, use callback to setState, then setState's callback to execute 2nd animation
    let sortableToOpacity = 1
    let sortableListToZIndex = 100
    let fullListToOpacity = 0
    let fullListToZIndex = 0

    Animated.parallel([
      Animated.timing(
        this.state.sortableListOpacity,
        {
          toValue: sortableToOpacity,
          timing: 300,
          useNativeDriver: false
        }
      ),
      Animated.timing(
        this.state.sortableListZIndex,
        {
          toValue: sortableListToZIndex,
          timing: 300
        }
      ),
      Animated.timing(
        this.state.fullListOpacity,
        {
          toValue: fullListToOpacity,
          timing: 300,
          useNativeDriver: false
        }
      ),
      Animated.timing(
        this.state.fullListZIndex,
        {
          toValue: fullListToZIndex,
          timing: 300
        }
      )
    ]).start()
  }

  disableSorting = () => {
    let sortableToOpacity = 0
    let sortableListToZIndex = 0
    let fullListToOpacity = 1
    let fullListToZIndex = 100

    Animated.parallel([
      Animated.timing(
        this.state.sortableListOpacity,
        {
          toValue: sortableToOpacity,
          timing: 300,
          useNativeDriver: false
        }
      ),
      Animated.timing(
        this.state.sortableListZIndex,
        {
          toValue: sortableListToZIndex,
          timing: 300
        }
      ),
      Animated.timing(
        this.state.fullListOpacity,
        {
          toValue: fullListToOpacity,
          timing: 300,
          useNativeDriver: false
        }
      ),
      Animated.timing(
        this.state.fullListZIndex,
        {
          toValue: fullListToZIndex,
          timing: 300
        }
      )
    ]).start()
  }

  renderArchivedSortableList = (data: any, order: any, label: any, renderRow: any) => {
    if (order) {
      return (
        <SortableListView
          style={styles.sortableWalletList}
          data={data}
          order={order}
          render={label}
          onRowMoved={this.onArchivedRowMoved}
          renderRow={renderRow}
        />
      )
    }
  }

  sortActiveWallets = (wallets: any) => {
    let activeOrdered = Object.keys(wallets).filter((key) => !wallets[key].archived) // filter out archived wallets
    .sort((a, b) => {
      if (wallets[a].sortIndex === wallets[b].sortIndex) {
        return -1
      } else {
        return wallets[a].sortIndex - wallets[b].sortIndex
      }
    }) // sort them according to their (previous) sortIndices
    return activeOrdered
  }

  onActiveRowMoved = (action: any) => {
    const newOrder = this.getNewOrder(this.props.activeWalletIds, action) // pass the old order to getNewOrder with the action ( from, to, and  )

    this.props.updateActiveWalletsOrder(newOrder)
    this.forceUpdate()
  }

  onArchivedRowMoved = (action: any) => {
    const wallets = this.props.wallets
    const activeOrderedWallets = Object.keys(wallets).filter((key) => wallets[key].archived)
    .sort((a, b) => wallets[a].sortIndex - wallets[b].sortIndex)
    const order = activeOrderedWallets
    const newOrder = this.getNewOrder(order, action)

    this.props.updateArchivedWalletsOrder(newOrder)
    this.forceUpdate()
  }

  getNewOrder = (order: any, action: any) => {
    const {to, from} = action
    const newOrder = [].concat(order)
    newOrder.splice(to, 0, newOrder.splice(from, 1)[0])

    return newOrder
  }

  renderDeleteWalletModal = () => <StylizedModal
    featuredIcon={<DeleteIcon />}
    headerText='fragment_wallets_delete_wallet'
    modalMiddle={<DeleteWalletSubtext />}
    modalBottom={<DeleteWalletButtons walletId={this.props.walletId} />}
    visibilityBoolean={this.props.deleteWalletModalVisible}
    onExitButtonFxn={this.props.closeDeleteWalletModal}
    />

  renderRenameWalletModal = () => <StylizedModal
    featuredIcon={<RenameIcon />}
    headerText='fragment_wallets_rename_wallet'
    headerSubtext={this.props.walletName}
    modalMiddle={<WalletNameInput />}
    modalBottom={<RenameWalletButtons walletName={this.props.walletName} walletId={this.props.walletId} />}
    visibilityBoolean={this.props.renameWalletModalVisible}
    onExitButtonFxn={this.props.closeRenameWalletModal}
    />

  tallyUpTotalCrypto = () => {
    const temporaryTotalCrypto = {}
    for (const parentProp in this.props.wallets) {
      for (const balanceProp in this.props.wallets[parentProp].nativeBalances) {
        if (!temporaryTotalCrypto[balanceProp]) {
          temporaryTotalCrypto[balanceProp] = 0
        }
        const nativeBalance = this.props.wallets[parentProp].nativeBalances[balanceProp]
        if (nativeBalance && nativeBalance !== '0') {
          const denominations = this.props.settings[balanceProp].denominations
          const exchangeDenomination = denominations.find((denomination) => denomination.name === balanceProp)
          const nativeToExchangeRatio:string = exchangeDenomination.multiplier

          const cryptoAmount:number = parseFloat(UTILS.convertNativeToExchange(nativeToExchangeRatio)(nativeBalance))
          temporaryTotalCrypto[balanceProp] = temporaryTotalCrypto[balanceProp] + cryptoAmount
        }
      }
    }
    let totalBalance = this.calculateTotalBalance(temporaryTotalCrypto)
    return totalBalance
  }

  calculateTotalBalance = (values: any) => {
    let total = 0
    for (let currency in values) {
      let addValue = this.props.currencyConverter.convertCurrency(currency, 'iso:' + this.props.settings.defaultFiat, values[currency])
      total = total + addValue
    }
    return total.toFixed(2)
  }

  handleOnBalanceBoxPress = () => this.setState({balanceBoxVisible: !this.state.balanceBoxVisible})
  balanceBox (fiatBalanceString: string) {
    return <View style={[styles.totalBalanceBox]}>
      <View style={[styles.totalBalanceWrap]}>
        <View style={[styles.totalBalanceHeader]}>
          <T style={[styles.totalBalanceText]}>
            {strings.enUS['fragment_wallets_balance_text']}
          </T>
        </View>
        <View style={[styles.currentBalanceBoxDollarsWrap]}>
          <T style={[styles.currentBalanceBoxDollars]}>
            {fiatBalanceString}
          </T>
        </View>
      </View>
    </View>
  }

  hiddenBalanceBox () {
    return <View style={[styles.totalBalanceBox]}>
      <View style={[styles.totalBalanceWrap]}>
        <View style={[styles.hiddenBalanceBoxDollarsWrap]}>
          <T style={[styles.currentBalanceBoxDollars]}>
            {SHOW_BALANCE_TEXT}
          </T>
        </View>
      </View>
    </View>
  }
}
