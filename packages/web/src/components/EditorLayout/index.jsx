import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import DownloadIcon from '@mui/icons-material/Download';
import Snackbar from '@mui/material/Snackbar';
import { ReactFlowProvider } from 'reactflow';

import { EditorProvider } from 'contexts/Editor';
import { TopBar } from './style';
import * as URLS from 'config/urls';
import Can from 'components/Can';
import Container from 'components/Container';
import EditableTypography from 'components/EditableTypography';
import Editor from 'components/Editor';
import EditorNew from 'components/EditorNew/EditorNew';
import useFlow from 'hooks/useFlow';
import useFormatMessage from 'hooks/useFormatMessage';
import useUpdateFlow from 'hooks/useUpdateFlow';
import useUpdateFlowStatus from 'hooks/useUpdateFlowStatus';
import useExportFlow from 'hooks/useExportFlow';
import useDownloadJsonAsFile from 'hooks/useDownloadJsonAsFile';
import useEnqueueSnackbar from 'hooks/useEnqueueSnackbar';

const useNewFlowEditor = process.env.REACT_APP_USE_NEW_FLOW_EDITOR === 'true';

export default function EditorLayout() {
  const { flowId } = useParams();
  const formatMessage = useFormatMessage();
  const enqueueSnackbar = useEnqueueSnackbar();
  const { mutateAsync: updateFlow } = useUpdateFlow(flowId);
  const { mutateAsync: updateFlowStatus } = useUpdateFlowStatus(flowId);
  const { mutateAsync: exportFlow } = useExportFlow(flowId);
  const downloadJsonAsFile = useDownloadJsonAsFile();
  const { data, isLoading: isFlowLoading } = useFlow(flowId);
  const flow = data?.data;

  const onFlowNameUpdate = async (name) => {
    await updateFlow({
      name,
    });
  };

  const onExportFlow = async (name) => {
    const flowExport = await exportFlow();

    downloadJsonAsFile({
      contents: flowExport.data,
      name: flowExport.data.name,
    });

    enqueueSnackbar(formatMessage('flowEditor.flowSuccessfullyExported'), {
      variant: 'success',
    });
  };

  return (
    <>
      <TopBar
        direction="row"
        bgcolor="white"
        justifyContent="space-between"
        alignItems="center"
        boxShadow={1}
        py={1}
        px={1}
        className="mui-fixed"
      >
        <Box display="flex" flex={1} alignItems="center">
          <Tooltip
            placement="right"
            title={formatMessage('flowEditor.goBack')}
            disableInteractive
          >
            <IconButton
              size="small"
              component={Link}
              to={URLS.FLOWS}
              data-test="editor-go-back-button"
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {!isFlowLoading && (
            <EditableTypography
              data-test="editableTypography"
              variant="body1"
              onConfirm={onFlowNameUpdate}
              noWrap
              sx={{ display: 'flex', flex: 1, maxWidth: '50vw', ml: 2 }}
            >
              {flow?.name}
            </EditableTypography>
          )}
        </Box>

        <Box pr={1} display="flex" gap={1}>
          <Can I="read" a="Flow" passThrough>
            {(allowed) => (
              <Button
                disabled={!allowed || !flow}
                variant="outlined"
                color="info"
                size="small"
                onClick={onExportFlow}
                data-test="export-flow-button"
                startIcon={<DownloadIcon />}
              >
                {formatMessage('flowEditor.export')}
              </Button>
            )}
          </Can>

          <Can I="publish" a="Flow" passThrough>
            {(allowed) => (
              <Button
                disabled={!allowed || !flow}
                variant="contained"
                size="small"
                onClick={() => updateFlowStatus(!flow.active)}
                data-test={
                  flow?.active ? 'unpublish-flow-button' : 'publish-flow-button'
                }
              >
                {flow?.active
                  ? formatMessage('flowEditor.unpublish')
                  : formatMessage('flowEditor.publish')}
              </Button>
            )}
          </Can>
        </Box>
      </TopBar>

      {useNewFlowEditor ? (
        <Stack direction="column" height="100%" flexGrow={1}>
          <Stack direction="column" flexGrow={1}>
            <EditorProvider value={{ readOnly: !!flow?.active }}>
              <ReactFlowProvider>
                {!flow && !isFlowLoading && 'not found'}
                {flow && <EditorNew flow={flow} />}
              </ReactFlowProvider>
            </EditorProvider>
          </Stack>
        </Stack>
      ) : (
        <Stack direction="column" height="100%">
          <Container maxWidth="md">
            <EditorProvider value={{ readOnly: !!flow?.active }}>
              {!flow && !isFlowLoading && 'not found'}
              {flow && <Editor flow={flow} />}
            </EditorProvider>
          </Container>
        </Stack>
      )}

      <Snackbar
        data-test="flow-cannot-edit-info-snackbar"
        open={!!flow?.active}
        message={formatMessage('flowEditor.publishedFlowCannotBeUpdated')}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        ContentProps={{ sx: { fontWeight: 300 } }}
        action={
          <Button
            variant="contained"
            size="small"
            onClick={() => updateFlowStatus(!flow.active)}
            data-test="unpublish-flow-from-snackbar"
          >
            {formatMessage('flowEditor.unpublish')}
          </Button>
        }
      />
    </>
  );
}
