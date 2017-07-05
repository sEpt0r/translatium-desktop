/* global Windows */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import shortid from 'shortid';
import classNames from 'classnames';

import { withStyles, createStyleSheet } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import IconButton from 'material-ui/IconButton';
import Paper from 'material-ui/Paper';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import { MenuItem } from 'material-ui/Menu';
import Button from 'material-ui/Button';
import { CircularProgress } from 'material-ui/Progress';
import Typography from 'material-ui/Typography';

import ActionSwapHoriz from 'material-ui-icons/SwapHoriz';
import ContentClear from 'material-ui-icons/Clear';
import NavigationMoreVert from 'material-ui-icons/MoreVert';
import ImageCameraAlt from 'material-ui-icons/CameraAlt';
import ImageImage from 'material-ui-icons/Image';
import ContentGesture from 'material-ui-icons/Gesture';
import AVVolumeUp from 'material-ui-icons/VolumeUp';
import AVStop from 'material-ui-icons/Stop';
import AVMic from 'material-ui-icons/Mic';
import ContentCopy from 'material-ui-icons/ContentCopy';
import SocialShare from 'material-ui-icons/Share';
import EditorFormatSize from 'material-ui-icons/FormatSize';
import ActionSwapVert from 'material-ui-icons/SwapVert';
import ToggleStarBorder from 'material-ui-icons/StarBorder';
import ToggleStar from 'material-ui-icons/Star';
import NavigationFullscreen from 'material-ui-icons/Fullscreen';
import NavigationFullscreenExit from 'material-ui-icons/FullscreenExit';

import EnhancedMenu from '../EnhancedMenu';

import {
  isOutput,
  isTtsSupported,
  isVoiceRecognitionSupported,
  isHandwritingSupported,
  isOcrSupported,
  toCountryRemovedLanguage,
} from '../../libs/languageUtils';

import {
  swapLanguages,
  updateInputLang,
  updateOutputLang,
} from '../../actions/settings';
import {
  updateInputText,
  translate,
  updateImeMode,
  togglePhrasebook,
  toggleFullscreenInputBox,
} from '../../actions/home';
import { loadImage } from '../../actions/ocr';
import { playTextToSpeech, stopTextToSpeech } from '../../actions/textToSpeech';
import { openSnackbar } from '../../actions/snackbar';

import getPlatform from '../../libs/getPlatform';
import copyToClipboard from '../../libs/copyToClipboard';
import shareText from '../../libs/shareText';
import askIfEnjoy from '../../libs/askIfEnjoy';

import Dictionary from './Dictionary';
import Handwriting from './Handwriting';
import Speech from './Speech';
import History from './History';

const styleSheet = createStyleSheet('Home', theme => ({
  container: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.palette.background.contentFrame,
  },
  anotherContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  inputContainer: {
    flex: '0 1 140px',
    height: 140,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    transition: 'flex 0.5s',
  },
  inputContainerFullScreen: {
    flex: 1,
    height: '100%',
  },
  textarea: {
    border: 0,
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    outline: 0,
    margin: 0,
    padding: 12,
    fontSize: 16,
    boxSizing: 'border-box',
    flex: 1,
  },
  controllerContainer: {
    flexBasis: 48,
    paddingLeft: 8,
    paddingRight: 8,
    boxSizing: 'border-box',
    borderTop: `1px solid ${theme.palette.text.disabled}`,
  },
  controllerContainerLeft: {
    float: 'left',
  },
  controllerContainerRight: {
    float: 'right',
    paddingTop: 6,
  },
  resultContainer: {
    flex: 1,
    padding: '0 12px 12px 12px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  resultContainerHidden: {
    flex: 0,
  },
  progressContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outputCard: {
    marginTop: 12,
  },
  languageTitle: {
    flex: 1,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  googleCopyright: {
    color: theme.palette.text.disabled,
  },
  inputRoman: {
    marginTop: 8,
  },
  suggestion: {
    marginTop: 8,
  },
}));

class Home extends React.Component {
  componentDidMount() {
    if (getPlatform() === 'windows') {
      const { preventScreenLock } = this.props;
      if (preventScreenLock === true) {
        this.dispRequest = new Windows.System.Display.DisplayRequest();
        this.dispRequest.requestActive();
      }
    }

    const { launchCount } = this.props;
    if (launchCount === 5) {
      askIfEnjoy();
    }
  }
  componentWillUnmount() {
    if (getPlatform() === 'windows') {
      if (this.dispRequest) {
        this.dispRequest.requestRelease();
      }
    }
  }

  renderOutput() {
    const {
      chinaMode,
      classes,
      fullscreenInputBox,
      onBiggerTextButtonClick,
      onListenButtonClick,
      onRequestCopyToClipboard,
      onSuggestedInputLangClick,
      onSuggestedInputTextClick,
      onSwapOutputButtonClick,
      onTogglePhrasebookClick,
      output,
      screenWidth,
      strings,
      textToSpeechPlaying,
    } = this.props;

    if (fullscreenInputBox === true) {
      return null;
    }

    if (!output) return <History />;

    switch (output.status) {
      case 'loading': {
        return (
          <div className={classes.progressContainer} >
            <CircularProgress size={80} />
          </div>
        );
      }
      default: {
        const controllers = [
          {
            icon: output.phrasebookId ? <ToggleStar /> : <ToggleStarBorder />,
            tooltip: output.phrasebookId ? strings.removeFromPhrasebook : strings.addToPhrasebook,
            onClick: onTogglePhrasebookClick,
          },
          {
            icon: <ActionSwapVert />,
            tooltip: strings.swap,
            onClick: () => onSwapOutputButtonClick(
              output.outputLang,
              output.inputLang,
              output.outputText,
            ),
          },
          {
            icon: <EditorFormatSize />,
            tooltip: strings.biggerText,
            onClick: () => onBiggerTextButtonClick(output.outputText),
          },
          {
            icon: <ContentCopy />,
            tooltip: strings.copy,
            onClick: () => onRequestCopyToClipboard(output.outputText, strings),
          },
        ];

        if (isTtsSupported(output.outputLang)) {
          controllers.unshift({
            icon: textToSpeechPlaying ? <AVStop /> : <AVVolumeUp />,
            tooltip: textToSpeechPlaying ? strings.stop : strings.listen,
            onClick: () =>
              onListenButtonClick(
                textToSpeechPlaying, output.outputLang, output.outputText, chinaMode,
              ),
          });
        }

        if (getPlatform() !== 'mac') {
          controllers.push({
            icon: <SocialShare />,
            tooltip: strings.share,
            onClick: () => shareText(output.outputText),
          });
        }

        const maxVisibleIcon = Math.min(Math.round((screenWidth - 120) / 56), controllers.length);
        const showMoreButton = (maxVisibleIcon < controllers.length);

        const hasDict = output.inputDict !== undefined && output.outputDict !== undefined;

        return (
          <div
            className={classNames(
              classes.resultContainer,
              { [classes.resultContainerHidden]: fullscreenInputBox },
            )}
          >
            {output.inputRoman && (
              <Typography
                type="body1"
                className={classNames('text-selectable', classes.inputRoman)}
              >
                {output.inputRoman}
              </Typography>
            )}

            {output.suggestedInputLang && (
              <Typography
                type="body1"
                align="left"
                className={classes.suggestion}
              >
                <span role="img" aria-label="">💡</span>
                <span>{strings.translateFrom}:&#32;</span>
                <a
                  role="button"
                  tabIndex={0}
                  onClick={() => onSuggestedInputLangClick(output.suggestedInputLang)}
                >
                  {strings[output.suggestedInputLang]}
                </a>
                <span>&#32;?&#32;</span>
              </Typography>
            )}

            {output.suggestedInputText && (
              <Typography
                type="body1"
                align="left"
                className={classes.suggestion}
              >
                <span role="img" aria-label="">💡</span>
                <span>{strings.didYouMean}:&#32;</span>
                <a
                  role="button"
                  tabIndex={0}
                  onClick={() => onSuggestedInputTextClick(output.suggestedInputText)}
                >
                  {output.suggestedInputText}
                </a>
                <span>&#32;?&#32;</span>
              </Typography>
            )}

            <Card className={classes.outputCard}>
              <CardContent className="text-selectable">
                <Typography
                  type="headline"
                  lang={toCountryRemovedLanguage(output.outputLang)}
                  className="text-selectable"
                >
                  {output.outputText}
                </Typography>

                {output.outputRoman && (
                  <Typography type="body1" className={classNames('text-selectable', classes.pos)}>
                    {output.outputRoman}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                {controllers.slice(0, maxVisibleIcon).map(({ icon, tooltip, onClick }) => (
                  <IconButton
                    aria-label={tooltip}
                    key={shortid.generate()}
                    onClick={onClick}
                  >
                    {icon}
                  </IconButton>
                ))}
                {showMoreButton && (
                  <EnhancedMenu
                    id="homeMore2"
                    buttonElement={(
                      <IconButton aria-label={strings.more} tooltipPosition="bottom-center">
                        <NavigationMoreVert />
                      </IconButton>
                    )}
                    anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                    targetOrigin={{ horizontal: 'left', vertical: 'top' }}
                  >
                    {
                      controllers
                        .slice(maxVisibleIcon, controllers.length)
                        .map(({ icon, tooltip, onClick }) => (
                          <MenuItem
                            leftIcon={icon}
                            key={shortid.generate()}
                            onClick={onClick}
                          >
                            {tooltip}
                          </MenuItem>
                        ))
                    }
                  </EnhancedMenu>
                )}
              </CardActions>
            </Card>
            {hasDict && <Dictionary output={output} />}
            <Typography
              type="body2"
              align="right"
              className={classes.googleCopyright}
            >
              {strings.translatedByGoogle}
            </Typography>
          </div>
        );
      }
    }
  }

  render() {
    const {
      classes,
      fullscreenInputBox,
      imeMode,
      inputLang, outputLang,
      inputText,
      onAnotherContainerClick,
      onCameraButtonClick,
      onClearButtonClick,
      onFullscreenButtonClick,
      onKeyDown, onInputText,
      onLanguageClick,
      onListenButtonClick,
      onOpenImageButtonClick,
      onSpeakButtonClick,
      onSwapButtonClick,
      onTranslateButtonClick,
      onWriteButtonClick,
      screenWidth,
      strings,
      textToSpeechPlaying,
      translateWhenPressingEnter,
    } = this.props;

    const controllers = [
      {
        icon: <ContentClear />,
        tooltip: strings.clear,
        onClick: onClearButtonClick,
      },
    ];

    if (isTtsSupported(inputLang)) {
      controllers.push({
        icon: textToSpeechPlaying ? <AVStop /> : <AVVolumeUp />,
        tooltip: textToSpeechPlaying ? strings.stop : strings.listen,
        onClick: () => onListenButtonClick(textToSpeechPlaying, inputLang, inputText),
      });
    }

    if (isVoiceRecognitionSupported(inputLang)) {
      controllers.push({
        icon: <AVMic />,
        tooltip: strings.speak,
        onClick: onSpeakButtonClick,
      });
    }

    if (isHandwritingSupported(inputLang)) {
      controllers.push({
        icon: <ContentGesture />,
        tooltip: strings.draw,
        onClick: onWriteButtonClick,
      });
    }

    if (isOcrSupported(inputLang)) {
      controllers.push({
        icon: <ImageImage />,
        tooltip: strings.openImageFile,
        onClick: onOpenImageButtonClick,
      });
    }

    controllers.push({
      icon: fullscreenInputBox ? <NavigationFullscreenExit /> : <NavigationFullscreen />,
      tooltip: fullscreenInputBox ? strings.exitFullscreen : strings.fullscreen,
      onClick: onFullscreenButtonClick,
    });

    if (getPlatform() === 'windows') {
      if (isOcrSupported(inputLang)) {
        controllers.splice(controllers.length - 2, 0, {
          icon: <ImageCameraAlt />,
          tooltip: strings.camera,
          onClick: onCameraButtonClick,
        });
      }
    }

    const maxVisibleIcon = Math.min(Math.round((screenWidth - 200) / 56), controllers.length);

    const showMoreButton = (maxVisibleIcon < controllers.length);

    return (
      <div className={classes.container}>
        <div
          className={classes.anotherContainer}
          role="presentation"
          onClick={() => onAnotherContainerClick(imeMode)}
        >
          <AppBar position="static">
            <Toolbar>
              <Typography
                type="title"
                color="inherit"
                align="center"
                role="button"
                className={classes.languageTitle}
                onClick={() => onLanguageClick('inputLang')}
              >
                {strings[inputLang]}
              </Typography>
              <IconButton
                color="contrast"
                disabled={!isOutput(inputLang)}
                onClick={onSwapButtonClick}
              >
                <ActionSwapHoriz />
              </IconButton>
              <Typography
                type="title"
                color="inherit"
                align="center"
                role="button"
                className={classes.languageTitle}
                onClick={() => onLanguageClick('outputLang')}
              >
                {strings[outputLang]}
              </Typography>
            </Toolbar>
          </AppBar>
          <Paper
            elevation={2}
            className={classNames(
              classes.inputContainer,
              { [classes.inputContainerFullScreen]: fullscreenInputBox },
            )}
          >
            <textarea
              className={classNames('text-selectable', classes.textarea)}
              lang={toCountryRemovedLanguage(inputLang)}
              placeholder={strings.typeSomethingHere}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onKeyDown={translateWhenPressingEnter ? e => onKeyDown(e) : null}
              onInput={onInputText}
              onKeyUp={onInputText}
              onClick={onInputText}
              onChange={onInputText}
              value={inputText}
            />
            <div className={classes.controllerContainer}>
              <div className={classes.controllerContainerLeft}>
                {controllers.slice(0, maxVisibleIcon).map(({ icon, tooltip, onClick }) => (
                  <IconButton
                    aria-label={tooltip}
                    key={shortid.generate()}
                    onClick={onClick}
                  >
                    {icon}
                  </IconButton>
                ))}
                {showMoreButton && (
                  <EnhancedMenu
                    id="homeMore"
                    buttonElement={(
                      <IconButton aria-label={strings.more}>
                        <NavigationMoreVert />
                      </IconButton>
                    )}
                  >
                    {
                      controllers
                        .slice(maxVisibleIcon, controllers.length)
                        .map(({ icon, tooltip, onClick }) => (
                          <MenuItem
                            leftIcon={icon}
                            key={shortid.generate()}
                            onClick={onClick}
                          >
                            {tooltip}
                          </MenuItem>
                        ))
                    }
                  </EnhancedMenu>
                )}
              </div>
              <div className={classes.controllerContainerRight}>
                <Button raised color="primary" onClick={onTranslateButtonClick}>
                  {strings.translate}
                </Button>
              </div>
            </div>
          </Paper>
          {this.renderOutput()}
        </div>
        {imeMode === 'handwriting' ? <Handwriting /> : null}
        {imeMode === 'speech' ? <Speech /> : null}
      </div>
    );
  }
}

Home.propTypes = {
  // eslint-disable-next-line
  chinaMode: PropTypes.bool,
  classes: PropTypes.object.isRequired,
  fullscreenInputBox: PropTypes.bool,
  imeMode: PropTypes.string,
  inputLang: PropTypes.string,
  inputText: PropTypes.string,
  launchCount: PropTypes.number,
  onAnotherContainerClick: PropTypes.func.isRequired,
  onBiggerTextButtonClick: PropTypes.func.isRequired,
  onCameraButtonClick: PropTypes.func.isRequired,
  onClearButtonClick: PropTypes.func.isRequired,
  onFullscreenButtonClick: PropTypes.func.isRequired,
  onInputText: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onLanguageClick: PropTypes.func.isRequired,
  onListenButtonClick: PropTypes.func.isRequired,
  onOpenImageButtonClick: PropTypes.func.isRequired,
  onRequestCopyToClipboard: PropTypes.func.isRequired,
  onSpeakButtonClick: PropTypes.func.isRequired,
  onSuggestedInputLangClick: PropTypes.func.isRequired,
  onSuggestedInputTextClick: PropTypes.func.isRequired,
  onSwapButtonClick: PropTypes.func.isRequired,
  onSwapOutputButtonClick: PropTypes.func.isRequired,
  onTogglePhrasebookClick: PropTypes.func.isRequired,
  onTranslateButtonClick: PropTypes.func.isRequired,
  onWriteButtonClick: PropTypes.func.isRequired,
  output: PropTypes.object,
  outputLang: PropTypes.string,
  preventScreenLock: PropTypes.bool,
  screenWidth: PropTypes.number,
  strings: PropTypes.objectOf(PropTypes.string).isRequired,
  textToSpeechPlaying: PropTypes.bool,
  translateWhenPressingEnter: PropTypes.bool,
};

const mapStateToProps = state => ({
  screenWidth: state.screen.screenWidth,
  translateWhenPressingEnter: state.settings.translateWhenPressingEnter,
  preventScreenLock: state.settings.preventingScreenLock,
  inputLang: state.settings.inputLang,
  outputLang: state.settings.outputLang,
  inputText: state.home.inputText,
  output: state.home.output,
  imeMode: state.home.imeMode,
  textToSpeechPlaying: state.textToSpeech.textToSpeechPlaying,
  fullscreenInputBox: state.home.fullscreenInputBox,
  launchCount: state.settings.launchCount,
  chinaMode: state.settings.chinaMode,
  strings: state.strings,
});

const mapDispatchToProps = dispatch => ({
  onLanguageClick: type =>
    dispatch(push({
      pathname: '/language-list',
      query: { type },
    })),
  onSwapButtonClick: () => dispatch(swapLanguages()),
  onKeyDown: (e) => {
    if (e.key === 'Enter') {
      dispatch(translate(true));
      e.target.blur();
    }

    const inputText = e.target.value;

    dispatch(updateInputText(inputText, e.target.selectionStart, e.target.selectionEnd));
  },
  onInputText: (e) => {
    const inputText = e.target.value;

    dispatch(updateInputText(inputText, e.target.selectionStart, e.target.selectionEnd));
  },
  onClearButtonClick: () => dispatch(updateInputText('')),
  onListenButtonClick: (toStop, lang, text, chinaMode) => {
    if (toStop) {
      dispatch(stopTextToSpeech());
      return;
    }
    dispatch(playTextToSpeech(lang, text, chinaMode));
  },
  onTranslateButtonClick: () => dispatch(translate(true)),
  onWriteButtonClick: () => dispatch(updateImeMode('handwriting')),
  onSpeakButtonClick: () => dispatch(updateImeMode('speech')),
  onTogglePhrasebookClick: () => dispatch(togglePhrasebook()),
  onOpenImageButtonClick: () => dispatch(loadImage(false)),
  onCameraButtonClick: () => dispatch(loadImage(true)),
  onSwapOutputButtonClick: (inputLang, outputLang, inputText) => {
    dispatch(updateInputLang(inputLang));
    dispatch(updateOutputLang(outputLang));
    dispatch(updateInputText(inputText));
  },
  onBiggerTextButtonClick: text =>
    dispatch(push({
      pathname: '/bigger-text',
      query: { text },
    })),
  onFullscreenButtonClick: () => dispatch(toggleFullscreenInputBox()),
  onSuggestedInputLangClick: value => dispatch(updateInputLang(value)),
  onSuggestedInputTextClick: text => dispatch(updateInputText(text)),
  onAnotherContainerClick: (imeMode) => {
    if (imeMode) dispatch(updateImeMode(null));
  },
  onRequestCopyToClipboard: (text, strings) => {
    copyToClipboard(text);
    dispatch(openSnackbar(strings.copied));
  },
});

export default connect(
  mapStateToProps, mapDispatchToProps,
)(withStyles(styleSheet)(Home));
