#' XY pad controller
#' @description Creates a XY pad controller to be included in a Shiny UI.
#'
#' @param inputId the input slot that will be used to access the value
#' @param label label for the XY pad, or \code{NULL} for no label
#' @param value the initial value, a list of two numbers named \code{"x"} and \code{"y"}
#' @param xmin,xmax minimal x-value and maximal x-value
#' @param ymin,ymax minimal y-value and maximal y-value
#' @param ndecimals number of decimals of the displayed coordinates (if \code{displayXY=TRUE})
#' @param width a positive number, the width in pixels
#' @param height a positive number, the height in pixels
#' @param bgColor background color, a HTML color
#' @param xyColor color of the labels of the coordinates (if \code{displayXY=TRUE}), a HTML color
#' @param xySize font size of the labels of the coordinates (if \code{displayXY=TRUE})
#' @param xyStyle font style of the labels of the coordinates (if \code{displayXY=TRUE}),
#'   \code{"normal"}, \code{"italic"} or \code{"oblique"}
#' @param coordsColor color of the displayed coordinates (if \code{displayXY=TRUE}), a HTML color
#' @param pointColor color of the point, a HTML color
#' @param pointRadius radius of the point in pixels
#' @param border CSS for the border of the XY pad
#' @param x label of the x-coordinate (if \code{displayXY=TRUE})
#' @param y label of the y-coordinate (if \code{displayXY=TRUE})
#' @param displayPrevious logical, whether to display the previous position of the point
#' @param displayXY logical, whether to display the coordinates
#' @param onMove logical, whether to send value to server on mouse move
#'   (\code{TRUE}) or on mouse release (\code{FALSE})
#'
#' @return A \code{shiny.tag.list} object generating a XY pad input control that
#'   can be added to a Shiny UI definition.
#' @seealso \code{\link{updateXYpadInput}} for updating the XY pad on server-side.
#' @export
#' @import shiny
#'
#' @examples
#' library(shiny)
#' library(shinyXYpad)
#' ui <- fluidPage(
#'   fluidRow(
#'     column(
#'       6,
#'       XYpadInput("xy1", onMove = TRUE, label = "XY pad - on move")
#'     ),
#'     column(
#'       6,
#'       XYpadInput(
#'         "xy2", label = "XY pad - on release",
#'         displayXY = FALSE, displayPrevious = FALSE
#'       )
#'     )
#'   ),
#'   fluidRow(
#'     column(6, verbatimTextOutput("xy1value")),
#'     column(6, verbatimTextOutput("xy2value"))
#'   )
#' )
#' server <- function(input, output, session){
#'   output[["xy1value"]] <- renderPrint({ input[["xy1"]] })
#'   output[["xy2value"]] <- renderPrint({ input[["xy2"]] })
#' }
#'
#' if(interactive()){
#'   shinyApp(ui, server)
#' }
XYpadInput <- function(inputId, label = NULL, value = list(x=50, y=50),
                       xmin=0, xmax=100, ymin=0, ymax=100, ndecimals = 2,
                       width = 200, height = 200,
                       bgColor = "rgba(255,240,230,0.5)",
                       xyColor = "blue", xySize = 11, xyStyle = "italic",
                       coordsColor = xyColor,
                       pointColor = "#16235a", pointRadius = 5,
                       border = "2px solid #777CA8",
                       x = "x", y = "y",
                       displayPrevious = TRUE,
                       displayXY = TRUE, onMove = FALSE) {
  if(is.null(names(value)) || !identical(sort(names(value)), c("x","y"))){
    names(value) <- c("x","y")
  }
  xyStyle <- match.arg(xyStyle, c("normal", "italic", "oblique"))
  addResourcePath(
    prefix = "wwwXY", directoryPath = system.file("www", package="shinyXYpad")
  )
  tagList(
    singleton(tags$head(tags$script(src = "wwwXY/XYpad.js"))),
    singleton(tags$head(tags$script(src = "wwwXY/XYpadBinding.js"))),
    tags$div(
      tags$div(style = "margin-bottom: 0; font-weight: bold;",
               id = paste0(inputId, "-xylabel"), label),
      tags$fieldset(
        id = inputId,
        class = "XYpad",
        `data-displayprevious` = ifelse(displayPrevious, "true", "false"),
        `data-displayinput` = ifelse(displayXY, "true", "false"),
        `data-onmove` = ifelse(onMove, "True", "False"),
        `data-width` = width,
        `data-height` = height,
        `data-xmin` = xmin,
        `data-xmax` = xmax,
        `data-ymin` = ymin,
        `data-ymax` = ymax,
        `data-ndecimals` = ndecimals,
        `data-bgcolor` = bgColor,
        `data-coordscolor` = coordsColor,
        `data-xycolor` = xyColor,
        `data-xysize` = xySize,
        `data-xystyle` = xyStyle,
        `data-pointcolor` = pointColor,
        `data-pointradius` = pointRadius,
        `data-border` = border,
        HTML(sprintf("%s: %s", x,
                     tags$input(name = "x",
                                value = sprintf(sprintf("%%.0%df", ndecimals),
                                                value[["x"]])))),
        HTML(sprintf("%s: %s", y,
                     tags$input(name = "y",
                                value = sprintf(sprintf("%%.0%df", ndecimals),
                                                value[["y"]]))))
      )
    )
  )
}


#' Change a XY pad input on the client
#' @description Changes a XY pad input on the client.
#'
#' @param session session object passed to the Shiny server function
#' @param inputId id of the XY pad input
#' @param label new label, or \code{NULL} for no change
#' @param value new value, or \code{NULL} for no change
#' @param xmin new \code{xmin}, or \code{NULL} for no change
#' @param xmax new \code{xmax}, or \code{NULL} for no change
#' @param ymin new \code{ymin}, or \code{NULL} for no change
#' @param ymax new \code{ymax}, or \code{NULL} for no change
#' @param ndecimals new \code{ndecimals}, or \code{NULL} for no change
#' @param bgColor new \code{bgColor}, or \code{NULL} for no change
#' @param pointColor new \code{pointColor}, or \code{NULL} for no change
#' @param pointRadius new \code{pointRadius}, or \code{NULL} for no change
#'
#' @export
#'
#' @examples
#' library(shiny)
#' library(shinyXYpad)
#' ui <- fluidPage(
#'   fluidRow(
#'     column(6, XYpadInput("xy", onMove = TRUE, label = "XY pad")),
#'     column(6, verbatimTextOutput("xyvalue"))
#'   ),
#'   br(),
#'   actionButton("update", "Update")
#' )
#' server <- function(input, output, session){
#'   output[["xyvalue"]] <- renderPrint({ input[["xy"]] })
#'   observeEvent(input[["update"]], {
#'     updateXYpadInput(session, "xy", value = list(x = 25, y = 25),
#'                      bgColor = "chartreuse", pointColor = "yellow",
#'                      pointRadius = 10, ndecimals = 3)
#'   })
#' }
#'
#' if(interactive()){
#'   shinyApp(ui, server)
#' }
updateXYpadInput <- function(session, inputId, label = NULL, value = NULL,
                             xmin = NULL, xmax = NULL,
                             ymin = NULL, ymax = NULL,
                             ndecimals = NULL,
                             bgColor = NULL,
                             pointColor = NULL, pointRadius = NULL) {
  options <- dropNulls(list(xmin = xmin, xmax = xmax,
                            ymin = ymin, ymax = ymax,
                            ndecimals = ndecimals,
                            bgColor = bgColor,
                            pointColor = pointColor,
                            pointRadius = pointRadius))
  message <- dropNulls(list(value = value,
                            label = label,
                            options = options))
  session$sendInputMessage(inputId, message)
}

