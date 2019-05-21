# shinyXYpad
An XY pad controller for Shiny.

```r
library(shiny)
library(shinyXYpad)
ui <- fluidPage(
  fluidRow(
    column(6, XYpadInput("xy1", pointRadius = 5, x = "X", y = "Y", 
                         coordsColor = "orange", 
                         xyColor = "red", xySize = 14, xyStyle = "oblique")),
    column(6, uiOutput("xy2UI"))
  ),
  br(),
  actionButton("update", "Update"),
  br(),
  fluidRow(
    column(6, verbatimTextOutput("xy1value")),
    column(6, verbatimTextOutput("xy2value"))
  )
)

server <- function(input, output, session){

  output[["xy1value"]] <- renderPrint({input[["xy1"]]})
  output[["xy2value"]] <- renderPrint({input[["xy2"]]})
  
  observeEvent(input[["update"]], {
    updateXYpadInput(session = session, inputId = "xy1", 
                     value = list(x=50, y=50), label = "XY controller", 
                     xmin = -100, ndecimals = 3, 
                     bgColor = "silver", 
                     pointColor = "maroon", pointRadius = 15)
  })
  
  output[["xy2UI"]] <- renderUI({
    XYpadInput("xy2", pointColor = "red", 
               width = 100, height = 100, 
               onMove = TRUE, displayXY = FALSE, displayPrevious = FALSE)
  })
}

shinyApp(ui, server)
```
