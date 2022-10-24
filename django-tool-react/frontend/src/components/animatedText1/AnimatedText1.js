import './AnimatedText1.css';


const AnimatedText1 = (props) => {
    return (

        <div class="animated-text-container">
            <div class="row">
                <div class="col-md-12 text-center">
                    <h3 class="animate-charcter">{props.text}</h3>
                </div>
            </div>
        </div>

    )
}

export default AnimatedText1;